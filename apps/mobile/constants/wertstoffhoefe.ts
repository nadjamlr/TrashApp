import type { Location } from '@/services/locationsService';

// Statische Liste aller Münchner Wertstoffhöfe (Quelle: AWM Open Data, geoportal.muenchen.de)
const MATERIALS = ['Papier', 'Glas', 'Plastik', 'Metall', 'Elektroschrott', 'Sperrmüll', 'Grünschnitt', 'Altkleider'];

export const WERTSTOFFHOEFE: Location[] = [
  { id: 'awm_wertstoffhoefe.1',  name: 'Wertstoffhof Lindberghstraße 8a',      address: 'Lindberghstraße 8a',      lat: 48.19130001, lng: 11.59933032, distance_m: 0, materials: MATERIALS, type: 'wertstoffhof', opening_hours: null },
  { id: 'awm_wertstoffhoefe.2',  name: 'Wertstoffhof Arnulfstraße 290',         address: 'Arnulfstraße 290',         lat: 48.15366777, lng: 11.51532832, distance_m: 0, materials: MATERIALS, type: 'wertstoffhof', opening_hours: null },
  { id: 'awm_wertstoffhoefe.3',  name: 'Wertstoffhof Savitsstraße 79',          address: 'Savitsstraße 79',          lat: 48.16289972, lng: 11.64891385, distance_m: 0, materials: MATERIALS, type: 'wertstoffhof', opening_hours: null },
  { id: 'awm_wertstoffhoefe.4',  name: 'Wertstoffhof Lerchenstraße 13',         address: 'Lerchenstraße 13',         lat: 48.20319425, lng: 11.54288451, distance_m: 0, materials: MATERIALS, type: 'wertstoffhof', opening_hours: null },
  { id: 'awm_wertstoffhoefe.5',  name: 'Wertstoffhof Mauerseglerstraße 9',      address: 'Mauerseglerstraße 9',      lat: 48.11891199, lng: 11.69170157, distance_m: 0, materials: MATERIALS, type: 'wertstoffhof', opening_hours: null },
  { id: 'awm_wertstoffhoefe.6',  name: 'Wertstoffhof Truderinger Straße 2a',    address: 'Truderinger Straße 2a',    lat: 48.13549313, lng: 11.61905540, distance_m: 0, materials: MATERIALS, type: 'wertstoffhof', opening_hours: null },
  { id: 'awm_wertstoffhoefe.7',  name: 'Wertstoffhof Bayerwaldstraße 33',       address: 'Bayerwaldstraße 33',       lat: 48.08821733, lng: 11.63078655, distance_m: 0, materials: MATERIALS, type: 'wertstoffhof', opening_hours: null },
  { id: 'awm_wertstoffhoefe.8',  name: 'Wertstoffhof Tübinger Straße 13',       address: 'Tübinger Straße 13',       lat: 48.13228013, lng: 11.52651369, distance_m: 0, materials: MATERIALS, type: 'wertstoffhof', opening_hours: null },
  { id: 'awm_wertstoffhoefe.9',  name: 'Wertstoffhof Tischlerstraße 3',         address: 'Tischlerstraße 3',         lat: 48.10378549, lng: 11.47625665, distance_m: 0, materials: MATERIALS, type: 'wertstoffhof', opening_hours: null },
  { id: 'awm_wertstoffhoefe.10', name: 'Wertstoffhof Am Neubruch 23',           address: 'Am Neubruch 23',           lat: 48.19217761, lng: 11.49258329, distance_m: 0, materials: MATERIALS, type: 'wertstoffhof', opening_hours: null },
  { id: 'awm_wertstoffhoefe.11', name: 'Wertstoffhof Thalkirchner Straße 260',  address: 'Thalkirchner Straße 260',  lat: 48.10865037, lng: 11.54419778, distance_m: 0, materials: MATERIALS, type: 'wertstoffhof', opening_hours: null },
  { id: 'awm_wertstoffhoefe.12', name: 'Wertstoffhof Mühlangerstraße 100',      address: 'Mühlangerstraße 100',      lat: 48.17166748, lng: 11.43760453, distance_m: 0, materials: MATERIALS, type: 'wertstoffhof', opening_hours: null },
];
