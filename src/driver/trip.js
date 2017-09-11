import path from 'path';
import firebaseInstance from '../config/firebase';
import { api } from '../config/config';
import CONSTANT from '../lib/constant';
import response from '../lib/response';
import Util from '../lib/util';


const scriptName = path.basename(__filename);
console.log(`${scriptName} : starting...`);

const nodeRequest = api.v1.driver.trip.request;
const nodeResult = api.v1.driver.trip.result;
const nodeDrivers = api.v1.driver.drivers;
const nodeReadyDrivers = api.v1.driver.ready;
const nodeOrderOngoing = api.v1.order.ongoing;
const nodeOrderCompleted = api.v1.order.completed;

const requestRef = firebaseInstance().database().ref(nodeRequest);
const resultRef = firebaseInstance().database().ref(nodeResult);
const driversRef = firebaseInstance().database().ref(nodeDrivers);
const readyDriversRef = firebaseInstance().database().ref(nodeReadyDrivers);
const orderOngoingRef = firebaseInstance().database().ref(nodeOrderOngoing);
const orderCompletedRef = firebaseInstance().database().ref(nodeOrderCompleted);


const updateDriverStatus = (pushId, uuid, status) => new Promise((resolve, reject) => {
    if (uuid == null) {
        return reject('user not found');
    }

    console.log('status ->> ', status);
    if (status == null) return reject('status is required');

    const { startTrip, endTrip } = status;
    let driverStatus = CONSTANT.DRIVER_STATUS.READY;
    let userStatus = null;

    if (startTrip) {
        driverStatus = CONSTANT.DRIVER_STATUS.ON_TRIP;
        userStatus = CONSTANT.USER_STATUS.ON_TRIP;
    }
    console.log(driverStatus, userStatus);

    driversRef.child(uuid).once(CONSTANT.FIREBASE_EVENT.VALUE, (snapshot) => {
        if (snapshot == null || snapshot.val() == null) return reject('can not update location');

        const { order } = snapshot.val() || {};

        driversRef.child(uuid).update({
            status: driverStatus
        }, (error) => {
            if (error) {
                return reject('failed update status ', error);
            }
            return resolve();
        });

        if (order != null) {
            const { uid, orderNo } = order || {};

            if (endTrip) {
                readyDriversRef.child(uuid).update({
                    readyTime: { '.sv': 'timestamp' }
                }, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    console.log(`${uuid} is ready to receive order...`);
                    return null;
                });

                orderOngoingRef.child(uid).child(orderNo).once(CONSTANT.FIREBASE_EVENT.VALUE, (dataOrder) => {
                    if (dataOrder.val() == null) return reject('order not found');

                    const data = dataOrder.val();
                    orderOngoingRef.child(uid).child(orderNo).remove();
                    orderCompletedRef.child(uid).child(orderNo).update(data, (error) => {
                        if (error) {
                            return reject(error);
                        }
                        console.log(`${orderNo} moved to completed successfully...`);
                        return resolve();
                    });
                    return null;
                }, error => reject(error));
            } else {
                orderOngoingRef.child(uid).child(orderNo).update({ status: userStatus }, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    return resolve();
                });
            }
        }
        return null;
    }, error => reject(error));


    return null;
});

const onComplete = (snapshot) => {
    const pushId = snapshot.key;
    const val = snapshot.val();

    response.writeOnProgressResult(resultRef, pushId);

    const { uuid, status } = val || {};
    if (uuid == null) {
        response.updateErrorResult(requestRef, resultRef, pushId, 'user not found');
        return null;
    }

    updateDriverStatus(pushId, uuid, status).then(() => {
        response.updateSucessResult(requestRef, resultRef, pushId);
    }).catch((error) => {
        response.updateErrorResult(requestRef, resultRef, pushId, error);
    });
    return null;
};

const onError = (error) => {
    console.log(error);
};

const connect = () => {
    requestRef.on(CONSTANT.FIREBASE_EVENT.CHILD_ADDED, onComplete, onError);
};

module.exports.connect = connect;
