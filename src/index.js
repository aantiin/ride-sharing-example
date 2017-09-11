import DriverConnect from './driver/connect';
import DriverPresence from './driver/presence';
import DriverPickup from './driver/pickup';
import DriverTrip from './driver/trip';


import UserConnect from './user/connect';
import UserPresence from './user/presence';
import UserRequestDriver from './user/requestDriver';

DriverConnect.connect();
DriverPresence.presence();
DriverPickup.connect();
DriverTrip.connect();


UserConnect.connect();
UserPresence.presence();
UserRequestDriver.request();
