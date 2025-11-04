import type * as hc from '@actions/http-client';
import { jest } from '@jest/globals'

export const getJson = jest.fn<typeof hc.HttpClient.prototype.getJson>;

