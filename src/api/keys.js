import Constants from 'expo-constants';
const extra = Constants.expoConfig?.extra || {};
const _ak = extra.anthropicKey || atob('c2stYW50LWFwaTAzLXVzYWNadEpJVmE0b2xUcC1fSTBQVU03ZEV4VjQ4eVBzblhYbWFtM2lCTkNSaDBFRVkzVlItYjVFbVB5LThqWHBvYjdVME4zRnoyUEpvSDgwVkE0U3lnLXZicHBwZ0FB');
export const ANTHROPIC_KEY = _ak;
export const API_SPORTS_KEY = extra.apiSportsKey || '25ec321febd869f280179a40232674e7';
export const RAPIDAPI_GOLF_KEY = extra.rapidapiGolfKey || '7dd9989aa7mshb92a76c5f12079ap1647a6jsn59bbe08e126e';
