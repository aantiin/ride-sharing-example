const CONSTANT = {
    FIREBASE_EVENT: {
        CHILD_ADDED: 'child_added',
        CHILD_CHANGED: 'child_changed',
        CHILD_REMOVED: 'child_removed',
        CHILD_MOVED: 'child_moved',
        VALUE: 'value'
    },

    DRIVER_STATUS: {
        READY: 'READY',
        ON_THE_WAY_PICKUP: 'ON_THE_WAY_PICKUP',
        ON_TRIP: 'ON_TRIP'
    },

    USER_STATUS: {
        DRIVER_NOT_FOUND: 'DRIVER_NOT_FOUND',
        REQUEST_DRIVER: 'REQUEST_DRIVER',
        WAITING_DRIVER_PICKUP: 'WAITING_DRIVER_PICKUP',
        ON_TRIP: 'ON_TRIP'
    }
};
module.exports = CONSTANT;
