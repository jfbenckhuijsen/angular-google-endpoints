angular-google-endpoints
========================

Angular Factory service for creating APIs which interact with Google Endpoint APIs. This factory therefore saves you the boilerplate code
needed to create an Google Endpoints API. In provides the following features:

- Provides a regular Angular Service to interact with, supporting dependency inection.
- Provides a promises based API, so the asynchronous nature of Endpoint APIs is easily handled
- Provides automatic registration of all API methods
- Provides support for OAuth2 for APIs which require authentication.

### Installing Angular-Google-Endpoints

> Please note that using Angular Google Endpoints requires **Angular 1.3.x** or higher.

Below is a sample set of commands:

```bash
cd yourProjectDir
bower install angular-google-endpoints --save
```

### Usage

Now that you have installed [locally] the Angular libraries, simply include the script in your main HTML file:

```html
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no" />
</head>
    <body ng-app="YourApp">

    <div ng-controller="YourController">

    </div>

    <script src="/bower_components/angular/angular.js"></script>
    <script src="/bower_components/angular-google-endpoints/angular-google-endpoints.js"></script>
    <script>

        // Include app dependency on ngGoogleEndpoints

        angular.module( 'YourApp', [ 'ngGoogleEndpoints' ] )
            .controller("YourController", YourController );

    </script>

</body>
</html>
```

### Creating a Google Endpoint client

Once you've setup the scripts in your main HTML file, you can define a new service which utilizes angular-google-endpoints to create a client 
for your API:

```javascript
var YourAppServices = angular.module('YourApp.services', [ 'ngGoogleEndpoints' ]);

YourAppServices.factory('YourApiService', [ '$googleEndpoints', "$q", function($googleEndpoints, $q) {
    $googleEndpoints.initClientId("[YOUR CLIENT ID]"); // (1)
    $googleEndpoints.requireOAuth2(); // (2)
    return $googleEndpoints.createApiClient('[YOUR API NAME]', '[Your API VERSION]', '[YOUR API ROOT]'); // (3)
} ]);
```

The following changes have to be made to this code:

1.  You need to provide your own client ID as registered in the Google Developer console in the Credentials section. This only needs to be made once.
2.  In case your API requires authentication based on OAuth2, call this method to enable authentication.
3.  Creates a new API Client. You need to provide the name of your API, its version and optionally the API root. The API root is in the form "'//[HOST]:[PORT]/_ah/api'. If omitted, this defaults to the host the web application is running on.

### Using the created Google Endpoint client

The new service client you've created can be used from e.g. your agular controller. However, Google Endpoint APIs are loading dynamically. This means
that you cannot know upfront when loading has finished. There are two ways to handle this. First, a simple flag based API, where the service client exposes a flag to indicate whether the API has been loaded.

```javascript
angular.module('YourApp.controllers', []).controller(
        'AppController',
        [ '$scope', 'YourApiService', function($scope, YourApiService) {
            if (YourApiService.loaded) {
                // Do something once loaded..
            }
        }]);

```

Another way is to utilse a Angular promise based API:
```javascript
angular.module('YourApp.controllers', []).controller(
        'AppController',
        [ '$scope', 'YourApiService', function($scope, YourApiService) {
            if (YourApiService.onceLoaded.then(function() {
                // Your API is loaded and can be used now.
            }, function(resp) {
                // An error has occurred
            });
        }]);
```

To call an method of your API. This also utilizes a Angular Promise based API.
```javascript
angular.module('YourApp.controllers', []).controller(
        'AppController',
        [ '$scope', 'YourApiService', function($scope, YourApiService) {
            YourApiService.one.of.your.methods([PARAMETERS]).then(function(resp) {
                // Your method has been called succesfully. The resp parameter contains the response.
            }, function(resp) {
                // An error has occored. The resp parameter contains the error information.
            }); 
        }]);
```

In case you're using an API which requires authentication, the currently logged in user is also available to you, once the API has loaded:
```javascript
angular.module('YourApp.controllers', []).controller(
        'AppController',
        [ '$scope', 'YourApiService', function($scope, YourApiService) {
            if (YourApiService.onceLoaded.then(function() {
                // YourApiService.currentUser contains the logged in user information.
            }, function(resp) {
                // An error has occurred
            });
        }]);
```
