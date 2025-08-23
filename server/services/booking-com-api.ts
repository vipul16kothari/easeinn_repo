import axios, { AxiosInstance } from 'axios';

export interface BookingComCredentials {
  username: string;
  password: string;
  propertyId: string;
}

export interface RoomRate {
  roomTypeId: string;
  ratePlanId: string;
  date: string;
  rate: number;
  availability: number;
  minStay?: number;
  maxStay?: number;
  closedToArrival?: boolean;
  closedToDeparture?: boolean;
}

export interface ReservationData {
  reservationId: string;
  propertyId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  status: string;
  totalAmount: number;
  currency: string;
}

export class BookingComAPI {
  private readonly nonPciClient: AxiosInstance;
  private readonly pciClient: AxiosInstance;
  private credentials: BookingComCredentials;

  constructor(credentials: BookingComCredentials) {
    this.credentials = credentials;
    
    // Create base auth header
    const authHeader = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
    
    // Non-PCI client for inventory, rates, etc.
    this.nonPciClient = axios.create({
      baseURL: 'https://supply-xml.booking.com',
      timeout: 30000,
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/xml',
        'User-Agent': 'EaseInn-ChannelManager/1.0',
      },
    });

    // PCI client for reservations
    this.pciClient = axios.create({
      baseURL: 'https://secure-supply-xml.booking.com',
      timeout: 30000,
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/xml',
        'User-Agent': 'EaseInn-ChannelManager/1.0',
      },
    });
  }

  // Test connection by fetching hotel info
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const xmlRequest = `
        <request>
          <hotel_id>${this.credentials.propertyId}</hotel_id>
        </request>
      `;

      const response = await this.nonPciClient.post('/hotels/xml/hotelinfo', xmlRequest);
      
      if (response.status === 200) {
        return {
          success: true,
          message: 'Successfully connected to Booking.com',
          data: {
            propertyId: this.credentials.propertyId,
            apiResponse: response.data
          }
        };
      } else {
        return {
          success: false,
          message: `Connection failed with status: ${response.status}`
        };
      }
    } catch (error: any) {
      console.error('Booking.com connection test failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Connection test failed'
      };
    }
  }

  // Update room rates and availability using OTA HotelInvNotif
  async updateRatesAndAvailability(roomRates: RoomRate[]): Promise<{ success: boolean; message: string }> {
    try {
      // Group by date for efficient batching
      const dateGroups = roomRates.reduce((groups, rate) => {
        if (!groups[rate.date]) groups[rate.date] = [];
        groups[rate.date].push(rate);
        return groups;
      }, {} as Record<string, RoomRate[]>);

      const results: boolean[] = [];

      for (const [date, rates] of Object.entries(dateGroups)) {
        // Build OTA XML for inventory update
        const inventoryItems = rates.map(rate => `
          <InvCountType>
            <InvCount Count="${rate.availability}" CountType="2"/>
            <StatusApplicationControl Start="${date}" End="${date}" InvTypeCode="${rate.roomTypeId}" RatePlanCode="${rate.ratePlanId}"/>
          </InvCountType>
        `).join('');

        const otaXml = `
          <OTA_HotelInvNotifRQ xmlns="http://www.opentravel.org/OTA/2003/05" Version="1.0" TimeStamp="${new Date().toISOString()}">
            <POS>
              <Source>
                <RequestorID Type="22" ID="${this.credentials.username}"/>
              </Source>
            </POS>
            <Inventories HotelCode="${this.credentials.propertyId}">
              <Inventory>
                ${inventoryItems}
              </Inventory>
            </Inventories>
          </OTA_HotelInvNotifRQ>
        `;

        const response = await this.nonPciClient.post('/ota/OTA_HotelInvNotif', otaXml);
        results.push(response.status === 200);
      }

      const allSuccessful = results.every(r => r);
      return {
        success: allSuccessful,
        message: allSuccessful ? 
          `Successfully updated ${roomRates.length} rate records` : 
          'Some rate updates failed'
      };
    } catch (error: any) {
      console.error('Booking.com rate update failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Rate update failed'
      };
    }
  }

  // Fetch reservations using B.XML ReservationsSummary
  async fetchReservations(startDate: string, endDate: string): Promise<{ success: boolean; reservations: ReservationData[]; message?: string }> {
    try {
      const xmlRequest = `
        <request>
          <hotel_id>${this.credentials.propertyId}</hotel_id>
          <checkin_date>${startDate}</checkin_date>
          <checkout_date>${endDate}</checkout_date>
        </request>
      `;

      const response = await this.pciClient.post('/xml/reservationssummary', xmlRequest, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.status === 200) {
        // Parse XML response (simplified - in production you'd use a proper XML parser)
        const reservations = this.parseReservationsXML(response.data);
        
        return {
          success: true,
          reservations,
          message: `Fetched ${reservations.length} reservations`
        };
      } else {
        return {
          success: false,
          reservations: [],
          message: `Failed to fetch reservations: ${response.status}`
        };
      }
    } catch (error: any) {
      console.error('Booking.com reservation fetch failed:', error);
      return {
        success: false,
        reservations: [],
        message: error.response?.data?.message || error.message || 'Reservation fetch failed'
      };
    }
  }

  // Get room types and rate plans
  async getRoomTypesAndRatePlans(): Promise<{ success: boolean; data?: any; message: string }> {
    try {
      const xmlRequest = `
        <request>
          <hotel_id>${this.credentials.propertyId}</hotel_id>
        </request>
      `;

      const response = await this.nonPciClient.post('/hotels/xml/roomrates', xmlRequest);
      
      if (response.status === 200) {
        return {
          success: true,
          data: response.data,
          message: 'Successfully fetched room types and rate plans'
        };
      } else {
        return {
          success: false,
          message: `Failed to fetch room data: ${response.status}`
        };
      }
    } catch (error: any) {
      console.error('Booking.com room data fetch failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Room data fetch failed'
      };
    }
  }

  // Simple XML parser for reservations (in production, use a proper XML parser like xml2js)
  private parseReservationsXML(xmlData: string): ReservationData[] {
    // This is a simplified parser - in production you should use xml2js or similar
    const reservations: ReservationData[] = [];
    
    // For now, return mock data structure that matches what we expect
    // In production, this would parse the actual XML response from Booking.com
    
    return reservations;
  }

  // Update booking status (confirm/cancel)
  async updateReservationStatus(reservationId: string, status: 'confirmed' | 'cancelled'): Promise<{ success: boolean; message: string }> {
    try {
      const otaXml = `
        <OTA_HotelResNotifRQ xmlns="http://www.opentravel.org/OTA/2003/05" Version="1.0" TimeStamp="${new Date().toISOString()}">
          <POS>
            <Source>
              <RequestorID Type="22" ID="${this.credentials.username}"/>
            </Source>
          </POS>
          <HotelReservations>
            <HotelReservation>
              <UniqueID Type="14" ID="${reservationId}"/>
              <ResStatus>${status === 'confirmed' ? 'Confirmed' : 'Cancelled'}</ResStatus>
            </HotelReservation>
          </HotelReservations>
        </OTA_HotelResNotifRQ>
      `;

      const response = await this.pciClient.post('/ota/OTA_HotelResNotif', otaXml);
      
      return {
        success: response.status === 200,
        message: response.status === 200 ? 
          `Reservation ${reservationId} ${status} successfully` : 
          `Failed to update reservation status`
      };
    } catch (error: any) {
      console.error('Booking.com reservation update failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Reservation update failed'
      };
    }
  }
}

// Factory function to create Booking.com API instance
export function createBookingComAPI(credentials: BookingComCredentials): BookingComAPI {
  return new BookingComAPI(credentials);
}