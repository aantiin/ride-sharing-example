const generateOrderNumber = (uid) => {
    if (uid) {
        let num = 0;
        uid.split('').map((each) => {
            num += each.charCodeAt(0);
            return num;
        });
        const now = (Math.random() * Date.now() * num).toString(20).substr(2, 2).toUpperCase();
        const hash = (Math.random().toString(36).substr(2, 6)).toUpperCase();
        return `${now}${hash}`;
    }
    return null;
};

module.exports.generateOrderNumber = generateOrderNumber;
