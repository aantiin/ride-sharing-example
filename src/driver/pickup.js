import path from 'path';
import firebaseInstance from '../config/firebase';
import { api } from '../config/config';
import CONSTANT from '../lib/constant';
import response from '../lib/response';
import Util from '../lib/util';


const scriptName = path.basename(__filename);
console.log(`${scriptName} : starting...`);

const nodeRequest = api.v1.driver.pickup.request;
const nodeResult = api.v1.driver.pickup.result;
const nodeDrivers = api.v1.driver.drivers;
const nodeReadyDrivers = api.v1.driver.ready;
const ongoingOrders = api.v1.order.ongoing;


const requestRef = firebaseInstance().database().ref(nodeRequest);
const resultRef = firebaseInstance().database().ref(nodeResult);
const driversRef = firebaseInstance().database().ref(nodeDrivers);
const readyDriversRef = firebaseInstance().database().ref(nodeReadyDrivers);
const ongoingOrdersRef = firebaseInstance().database().ref(ongoingOrders);


const deleteRequest = (orderNo) => {
    readyDriversRef.once(CONSTANT.FIREBASE_EVENT.VALUE, (snapshot) => {
        const drivers = snapshot.val();
        if (drivers) {
            Object.keys(drivers).map((key) => {
                readyDriversRef.child(key).child('request').child(orderNo).remove();
                return true;
            });
        }
    }, (error) => {
        console.log(error);
    });
};

const pickDriver = (uuidDriver, uid, orderNo) => new Promise((resolve, reject) => {
    console.log('pickDriver ->>>>');

    ongoingOrdersRef.child(uid).child(orderNo).child('drivers').orderByKey()
        .once(CONSTANT.FIREBASE_EVENT.VALUE, (snapshot) => {
            const bids = snapshot.val();
            if (bids == null) return reject('can not pick up');

            const arr = Object.keys(bids).map(key => key);
            const winner = arr[arr.length - 1];

            if (winner !== uuidDriver) return reject('can not pick up');
            return resolve(true);
        }, error => reject(error));
});

const pickupOrder = (pushId, uuid, order, driverInfo) => new Promise((resolve, reject) => {
    const { uid, orderNo } = order || {};

    ongoingOrdersRef.child(uid).child(orderNo).once(CONSTANT.FIREBASE_EVENT.VALUE, (snapshot) => {
        if (snapshot == null || snapshot.val() == null) return reject('can not pick up');
        const { status } = snapshot.val() || {};

        if (status !== CONSTANT.USER_STATUS.REQUEST_DRIVER) return reject('order already picked by other driver');


        // console.log(Date.now(), 'pickup ->> ', payload);
        const payload = {};
        payload[uuid] = Date.now();
        ongoingOrdersRef.child(uid).child(orderNo).child('drivers').update(payload, (error) => {
            if (error) {
                return reject(error);
            }

            pickDriver(uuid, uid, orderNo).then((result) => {
                const payloadStatus = {
                    status: CONSTANT.USER_STATUS.WAITING_DRIVER_PICKUP,
                    driver: driverInfo,
                    drivers: null
                };
                ongoingOrdersRef.child(uid).child(orderNo).update(payloadStatus, (err) => {
                    if (err) return reject(err);

                    readyDriversRef.child(uuid).remove();
                    deleteRequest(orderNo);
                    return resolve(true);
                });

                driversRef.child(uuid).update({
                    status: CONSTANT.DRIVER_STATUS.ON_THE_WAY_PICKUP,
                    order: { uid, orderNo }
                }, err => console.log(err));
            }).catch(err => reject(err));
            return null;
        });

        return null;
    }, error => reject(error));

    return null;
});

const onComplete = (snapshot) => {
    const pushId = snapshot.key;
    const val = snapshot.val();

    response.writeOnProgressResult(resultRef, pushId);

    const { uuid, order } = val || {};
    if (uuid == null || order == null) {
        response.updateErrorResult(requestRef, resultRef, pushId, 'user not found');
        return null;
    }

    driversRef.child(uuid).once(CONSTANT.FIREBASE_EVENT.VALUE, (driver) => {
        if (driver == null || driver.val() == null) {
            response.updateErrorResult(requestRef, resultRef, pushId, 'driver info not found');
            return null;
        }

        const driverInfo = {
            info: driver.val().info,
            location: driver.val().location
        };

        pickupOrder(pushId, uuid, order, driverInfo).then(() => {
            response.updateSucessResult(requestRef, resultRef, pushId);
        }).catch((error) => {
            response.updateErrorResult(requestRef, resultRef, pushId, error);
        });
        return null;
    }, (error) => {
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
