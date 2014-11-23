/*!
 * Angular Material Design
 * https://github.com/angular/material
 * @license MIT
 * v0.5.0
 */

function google_endpoints_init() {

	var $injector = angular.element(document.body).injector();

	var $googleEndpoints = $injector.get('$googleEndpoints');

	$googleEndpoints._init();
}

(function() {

	angular.module('ngGoogleEndpoints', [ "ng" ]);

	angular.module('ngGoogleEndpoints').factory('$googleEndpoints', [ "$q", function($q) {
		/*
		 * Internal state
		 */
		var state = {
				// Options set by the client
				clientId: null, /* Client ID configured on Google AppEngine */
				requiresOAuth2: false, /* Option to enable OAuth2 authentication */
				
				apis: new Array(), /* Set of registered APIs */
				
				currentUser: null /* Current user in case OAuth2 is required */ 
		}
		
		/*
		 * Init method called once Client script is loaded. Loads the required APIs, performs authentication if needed and setup of
		 * API delegates.
		 */
		function _init() {
			// Loads the OAuth and helloworld APIs asynchronously, and triggers init
			// when they have completed.
			var apisToLoad = state.apis.length;
			var callback = function() {
				if (--apisToLoad == 0) {
					if (state.requiresOAuth2) {
						// Handle OAuth callback and resolve deferreds once done.
						signin(false, userAuthed);
					} else {
						// No Auth needed, apis are loaded, so setup API client methods.
						resolveDefereds();
					}
				}
			}
			
			if (state.requiresOAuth2) {
				apisToLoad++;
				gapi.client.load('oauth2', 'v2', callback);
			}
			
			for (var i = 0 ; i < state.apis.length; i++) {
				var api = state.apis[i];
				gapi.client.load(api.apiName, api.apiVersion, callback, api.apiRoot);
			}
		}
		
		function userAuthed() {
			var request = gapi.client.oauth2.userinfo.get().execute(function(resp) {
				/*
				 * Verified_email flag does not need to be checked. See: http://stackoverflow.com/questions/10893029/authenticating-with-google-with-oauth-2-0-and-userinfo-api-what-does-it-mean-fo
				 */
				if (!resp.code) {
					// User is signed in, resolve deferreds.
					state.currentUser = resp;
					resolveDefereds();
				} else {
					// User not authenticated, reject defereds.
					rejectDefereds(resp);
				}
			});
		}

		function signin(mode, authorizeCallback) {
			gapi.auth.authorize({
				client_id : state.clientId,
				scope : "https://www.googleapis.com/auth/userinfo.email",
				immediate : mode
			}, authorizeCallback);
		}

		function resolveDefereds() {
			for (var i = 0; i < state.apis.length; i++) {
				state.apis[i].defered.resolve();
			}
		}

		function rejectDefereds(resp) {
			for (var i = 0; i < state.apis.length; i++) {
				state.apis[i].defered.reject(resp);
			}
		}

		/*
		 * Setup API Methods based on GAPI interface definition.
		 */
		function setupApiMethods(api) {
			var namespace = gapi.client[api.apiName];
			traverseNamespace(api.service, namespace, new Array(), api);
		}
		
		function traverseNamespace(context, namespace, path, api) {
			for (var property in namespace) {
			    if (namespace.hasOwnProperty(property) && property != "kB") {
			    	var value = namespace[property];
			    	
			    	// Create child context and traverse
			    	if (typeof value == "object") {
			    		var childContext = {};
			    		
			    		var childPath = path.slice(0)
			    		childPath.push(property);
			    		
			    		context[property] = childContext;
			    		traverseNamespace(childContext, value, childPath, api);
			    	}
			    	
			    	// Create function to call.
			    	if (typeof value == "function") {
		    			var gapiContext = gapi.client[api.apiName];
		    			for (var i = 0; i < path.length; i++) {
		    				var segment = path[i];
		    				gapiContext = gapiContext[segment];
		    			}
		    			
		    			var gapiFunc = gapiContext[property];
		    			
		    			// Create delegate function using promises to handle async interaction with Google Endpoints.
		    			context[property] = function() {
		    				var delegateFunc = gapiFunc;
		    				
		    				return function() {
				    			var defered = $q.defer();
				    			
				    			delegateFunc.apply(null, arguments).execute(function(resp) {
				    				if (resp.code) {
				    					defered.reject(resp);
				    				} else {
				    					defered.resolve(resp);
				    				}
				    			});
			    				
			    				return defered.promise;
				    		};
		    			}();
			    		
			    	}
			    }
			}
		}
		
		/*
		 * API Functions
		 */
		function initClientId(clientId) {
			state.clientId = clientId;
		}
		
		function requireOAuth2() {
			state.requiresOAuth2 = true;
		}
		
		function createApiClient(apiName, apiVersion, apiRoot) {
			var onceLoaded = $q.defer();
			
			var api = {
				apiName: apiName,
				apiVersion: apiVersion,
				apiRoot: (typeof apiRoot == "undefined" ? apiRoot: '//' + window.location.host + '/_ah/api'),
				defered: $q.defer(),
				service: {
					loaded: false,
					failed: false,
					onceLoaded: onceLoaded.promise
				}
			};
			
			// Once loaded setup the API in the service object
			api.defered.promise.then(function() {
				setupApiMethods(api);
				api.service.loaded = true;
				api.service.currentUser = state.currentUser;
				onceLoaded.resolve();
			}, function() {
				api.service.failed = true;
				onceLoaded.reject();
			})
			state.apis.push(api);
			
			// Return the service object which represents the client.
			return api.service;
		}
		
		// Add Google client script
		var clientScript = document.createElement("SCRIPT");
		clientScript.src = "https://apis.google.com/js/client.js?onload=google_endpoints_init";
		document.body.appendChild(clientScript);
		
		// Return API object
		return {
			initClientId: initClientId,
			requireOAuth2: requireOAuth2,
			createApiClient: createApiClient,
			
			// Internal method
			_init : _init,
		}
	}  ]);

})();
