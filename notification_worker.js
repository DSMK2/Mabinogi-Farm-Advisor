var notificationInterval;

self.onmessage = function(message) {
    var notificationOptions = message.data.options;
    var notificationTime = message.data.time;
    
    if (notificationInterval) {
        clearInterval(notificationInterval);
    }
    
    notificationInterval = setInterval(function() {
        var dateCurrent = new Date();

        if (dateCurrent.getTime() >= notificationTime) {
            todoNotification = new Notification('Mabinogi Farm Advisor', notificationOptions);
            clearInterval(notificationInterval);
            self.close();
        }
    }, 1000);
}