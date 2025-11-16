import moment from 'moment';
import { TotoAPI, cid } from './TotoAPI';

/**
 * API to access the /auth/ Toto API
 */
export class AuthAPI {

  /**
   * Get generic app settings
   * from the /app/expenses microservice
   */
  async getTotoToken(googleToken: string) {

    return new TotoAPI().fetch('auth', `/token`, {
      method: "GET",
      headers: {
        'Accept': 'application/json',
        'x-correlation-id': cid(),
        'x-client': "galeUI",
        'Authorization': `Bearer ${googleToken}`
      }
    }, false, true).then((response) => response.json());

  }

  async verifyToken(totoToken: string) {

    return new TotoAPI().fetch('auth', `/verify`, {
      method: "POST",
      headers: {
        'Accept': 'application/json',
        'x-correlation-id': cid(),
        'x-client': "galeUI",
        'Authorization': `Bearer ${totoToken}`
      }
    }, false, true).then((response) => response.json());


  }

}
