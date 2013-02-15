var Controller = {};

// INIT
Controller.MSG_INIT = 'INIT';

// PAGES	
Controller.MSG_MOVE_PAGE = 'MOVE_PAGE';
Controller.MSG_ADD_PAGE = 'ADD_PAGE';
Controller.MSG_REMOVE_PAGE = 'REMOVE_PAGE';
Controller.MSG_BACK = 'BACK';
Controller.MSG_ON_START = 'ON_START';
Controller.MSG_ON_STOP = 'ON_STOP';

// MENUS
Controller.MSG_SHOW_CATEGORIES = 'SHOW_CATEGORIES';
Controller.MSG_COOKIE_UPDATED = 'COOKIE_UPDATED';
Controller.MSG_ON_CATG = 'ON_CATG';
Controller.MSG_ON_DELETE_BOX = 'ON_DELETE_BOX';
Controller.MSG_ON_MESSAGE_BOX = 'ON_MESSAGE_BOX';
Controller.MSG_ON_LOGIN_BOX = 'ON_LOGIN_BOX';
Controller.MSG_ON_ADD_BOX = "ON_ADD_BOX";

Controller.MSG_EDIT = 'EDIT';
Controller.MSG_DELETE = 'DELETE';
Controller.MSG_DONE = 'DONE';

(function(q) {  
    var msgs = {},  
        subUid = -1;  
    
    q.publish = function(msg, args) {  
        if (!msgs[msg]) {  
        	return false;  
        }  
        var subscribers = msgs[msg],  
            len = subscribers ? subscribers.length : 0;  
  
        while (len--) {  
            subscribers[len].func(msg, args);    
        }    
    
        return true;    
    };    
    
    q.subscribe = function(msg, func) {    
        if (!msgs[msg]) {    
        	msgs[msg] = [];    
        }    
    
        var token = ++subUid;  // token is identifier, used to unsubscribe.  
        msgs[msg].push({    
            token: token,    
            func: func    
        });    
        return token;    
    };    
    
    q.unsubscribe = function(token) {    
        for (var msg in msgs) {
            for (var i=0, j=msgs[msg].length; i < j; i++) {    
                if (msgs[msg][i].token === token) {    
                    msgs[msg].splice(i, 1);    
                    return token;    
                }    
            }    
        }    
        return false;    
    };    
}(Controller));
