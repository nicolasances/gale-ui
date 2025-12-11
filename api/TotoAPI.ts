'use client'

import moment from 'moment';
import Cookies from 'universal-cookie';
import { ApiName, endpoint } from '@/Config';

const cookies = new Cookies();

export function cid() {

  let ts = moment().format('YYYYMMDDHHmmssSSS');

  let random = (Math.random() * 100000).toFixed(0).padStart(5, '0');

  return ts + '-' + random;

}

/**
 * Wrapper for the fetch() React method that adds the required fields for Toto authentication
 * @param noHeaderOverride set to true to avoid that this method overrides some of the headers
 */
export class TotoAPI {

  fetch(api: ApiName, path: string, options?: any, aws: boolean = false, noHeaderOverride: boolean = false) {

    if (options == null) options = { method: 'GET', headers: {} };
    if (options.headers == null) options.headers = {};

    let idToken = cookies.get('user') ? cookies.get('user').idToken : null

    // Adding standard headers
    if (!noHeaderOverride) {
      options.headers['Accept'] = 'application/json';
      options.headers['x-correlation-id'] = cid();
      options.headers['Authorization'] = 'Bearer ' + idToken;
      options.headers['Content-Type'] = 'application/json';

      if (aws) options.headers['toto-service'] = api;
    }
    
    return fetch(endpoint(api) + path, options);
  }
}

