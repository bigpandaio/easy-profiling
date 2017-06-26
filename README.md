### easy-profiling

Simple profiler based on v8-profiler

### Installation

``` bash
npm install git+ssh://git@github.com:bigpandaio/easy-profiling.git#master
```

### Basic Configuration:

```javascript
require('easy-profiling').init(params);
```

__params:__

| Name          | Description           | Default  |
| :------------ |:-------------| :-----:|
| datadir       | path for output profile files | current directory (./) |
| port          | port on which the manager will listen | 1991 |
| app           | express app for reuse | new express app |
| logger        | logger instance  | None |

### Advanced Usage:
##### express reuse:
If you already have express configured in your project, pass it in `params`, that way easy-profiling will only add its route using the __same express instance__ listening to the __same port__, instead of creating a __new express instance__ and listening to a __different port__.
```javascript
var params = { app: app };
require('easy-profiling').init(params);
```
##### logging & events:
If you want to follow on the package actions, pass a logger instance as a param or catch the events emitted from the package.


### Run Profiler:
##### Using Defaults:
Basic way to start profiling your app for 5s
```bash 
curl -XPOST localhost:<PORT>/profile
```

##### Custom Timeout:
To set custom timeout add the number of _ms_ to the route

__For example:__
10s timeout
```bash 
curl -XPOST localhost:<PORT>/profile/10000
```

##### Get Profile Status:
To get a specific profile's status, you get the <ID> from the response body when starting a new profile.

```bash 
curl -XGET localhost:<PORT>/profile/status/<ID>
```

