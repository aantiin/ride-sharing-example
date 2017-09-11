import fetch from 'node-fetch';
import { settings } from '../config/config';

const inRangeLat = (number) => {
    const min = -90;
    const max = 90;
    if (!isNaN(number) && (number >= min) && (number <= max)) {
        return true;
    }
    return false;
};

const inRangeLong = (number) => {
    const min = -180;
    const max = 180;
    if (!isNaN(number) && (number >= min) && (number <= max)) {
        return true;
    }
    return false;
};

const getLocation = (lat = null, lng = null) => new Promise((resolve, reject) => {
    const uri = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${settings.geocoding}`;
    if (lat == null || lng == null) return reject('lat long not found');

    if (!inRangeLong(lat) || !inRangeLong(lng)) return reject('lat long invalid');

    fetch(uri).then(res => res.json())
        .then((json) => {
            if (json == null) return reject('invalid location');
            const { results, status } = json || {};
            if (status !== 'OK') return reject('invalid location');

            const nearest = {
                location: results[0].geometry.location
            };
            nearest.location.formattedAddress = results[0].formatted_address;

            return resolve(nearest);
        }).catch(error => reject(error));

    return null;
});

module.exports.inRangeLat = inRangeLat;
module.exports.inRangeLong = inRangeLong;
module.exports.getLocation = getLocation;

