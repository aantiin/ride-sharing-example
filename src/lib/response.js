
const writeOnProgressResult = (ref, pushId) => {
    console.log('writeOnProgressResult');
    const payload = {
        onProgress: true,
    };
    ref.child(pushId).update(payload, (error) => {
        if (error) {
            console.log('writeOnProgressResult ERROR', pushId, error);
        }
    });
};

/**
 *
 * @param pushId
 * @param success
 * @param warning
 */
const updateSucessResult = (nodeRequest, nodeResult, pushId, success = true, warning = '', data = null) => {
    console.log('updateSucessResult');

    if (warning.length <= 0) {
        warning = null;
    }

    console.log(`updateResult : pushId ${pushId} success :${success} , warning ${warning}`);

    nodeResult.child(pushId).set({
        onProgress: false,
        success,
        warning,
        data
    });
    nodeRequest.child(pushId).remove();
};

/**
 *
 * @param pushId
 * @param error
 */
const updateErrorResult = (nodeRequest, nodeResult, pushId, error) => {
    console.log('updateErrorResult', error);

    const payload = {
        onProgress: false,
        success: false,
        error,
    };

    nodeResult.child(pushId).update(payload, (errorUpdate) => {
        if (errorUpdate) {
            console.log('writeOnProgressResult ERROR', pushId, error);
        }
    });
    nodeRequest.child(pushId).remove();
};

module.exports.writeOnProgressResult = writeOnProgressResult;
module.exports.updateSucessResult = updateSucessResult;
module.exports.updateErrorResult = updateErrorResult;
