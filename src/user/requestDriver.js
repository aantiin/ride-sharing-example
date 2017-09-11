import path from 'path';
import firebaseInstance from '../config/firebase';
import { api } from '../config/config';
import CONSTANT from '../lib/constant';
import response from '../lib/response';
import Util from '../lib/util';
import generator from '../lib/generator';


const scriptName = path.basename(__filename);
console.log(`${scriptName} : starting...`);

const nodeRequest = api.v1.user.requestDriver.request;
const nodeResult = api.v1.user.requestDriver.result;
const nodeUsers = api.v1.user.users;
const nodeDrivers = api.v1.driver.ready;
const nodeOrderOngoing = api.v1.order.ongoing;

const requestRef = firebaseInstance().database().ref(nodeRequest);
const resultRef = firebaseInstance().database().ref(nodeResult);
const usersRef = firebaseInstance().database().ref(nodeUsers);
const driversRef = firebaseInstance().database().ref(nodeDrivers);
const orderOngoingRef = firebaseInstance().database().ref(nodeOrderOngoing);

const broadcastOrder = ({ uuid, orderNo, drivers, order }) => {
    const payloadError = {
        status: CONSTANT.USER_STATUS.DRIVER_NOT_FOUND,
        requestTimestamp: { '.sv': 'timestamp' },
        onProgress: false
    };
    if (drivers == null) {
        orderOngoingRef.child(uuid).child(orderNo)
            .update(payloadError, (error => console.log(error)));
    }

    Object.keys(drivers).map((key) => {
        driversRef.child(key).child('request').child(orderNo).update(order, (error) => {
            if (error) {
                payloadError.error = error;
                orderOngoingRef.child(uuid).child(orderNo)
                    .update(payloadError, err => console.log(err));
            }
        });
        return true;
    });
};

const putToOrderOngoing = ({ pushId, uuid, orderNo, location }) =>
    new Promise((resolve, reject) => {
        if (pushId == null || uuid == null || orderNo == null || location == null) return reject('can not broadcast order, order no || location null');

    // get driver list
        driversRef.once(CONSTANT.FIREBASE_EVENT.VALUE, (snapshot) => {
            if (snapshot == null || snapshot.val() == null) return reject('failed to request, driver not found');

            const readyDrivers = snapshot.val();

            usersRef.child(uuid).once(CONSTANT.FIREBASE_EVENT.VALUE, (userInfoRef) => {
                if (userInfoRef == null || userInfoRef.val() == null || userInfoRef.val().info == null) return reject('user not found');
                const user = userInfoRef.val().info;
                const payload = {
                    user,
                    location,
                    status: CONSTANT.USER_STATUS.REQUEST_DRIVER,
                    requestTimestamp: { '.sv': 'timestamp' },
                    onProgress: true,
                    orderNo,
                    uid: uuid
                };

                orderOngoingRef.child(uuid).child(orderNo).update(payload, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    response.updateSucessResult(requestRef, resultRef, pushId, true, '', { orderNo });

                    broadcastOrder({ uuid, orderNo, drivers: readyDrivers, order: payload });
                    return null;
                });
                return null;
            }, error => reject(error));
            return null;
        }, (error) => {
            response.updateErrorResult(requestRef, resultRef, pushId, error);
        });
        return null;
    });

const requestOrderNo = (pushId, uuid) => new Promise((resolve, reject) => {
    const orderNo = generator.generateOrderNumber(uuid);
    if (orderNo == null || orderNo === '') return reject('failed to request driver, order no can not be generated');
    return resolve(orderNo);
});


const onComplete = (snapshot) => {
    const pushId = snapshot.key;
    const val = snapshot.val();

    response.writeOnProgressResult(resultRef, pushId);

    const { uuid, location } = val || {};
    if (uuid == null) {
        response.updateErrorResult(requestRef, resultRef, pushId, 'user not found');
        return null;
    }

    if (location == null) {
        response.updateErrorResult(requestRef, resultRef, pushId, 'location not found');
        return null;
    }

    Util.getLocation(location.lat, location.lng).then((nearestLocation) => {
        if (nearestLocation == null) {
            response.updateErrorResult(requestRef, resultRef, pushId, 'location not found');
            return null;
        }

        requestOrderNo(pushId, uuid).then((orderNo) => {
            putToOrderOngoing({ pushId, uuid, orderNo, location: nearestLocation.location });
        }).catch((error) => {
            response.updateErrorResult(requestRef, resultRef, pushId, error);
        });

        return null;
    }).catch((error) => {
        response.updateErrorResult(requestRef, resultRef, pushId, error);
        return null;
    });
    return null;
};

const onError = (error) => {
    console.log(error);
};

const request = () => {
    requestRef.on(CONSTANT.FIREBASE_EVENT.CHILD_ADDED, onComplete, onError);
};

module.exports.request = request;
