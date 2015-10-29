var Hapi = require('hapi');
var Good = require('good');
var Inert = require('inert');
var Path = require('path');
var JiraClient = require('jira-connector')
var url = require('url');
var jira_config = require('./jira.config.json');

var jira = new JiraClient( jira_config );

var server = new Hapi.Server({
  connections: {
    routes: {
      files : {
        relativeTo: '.'
      }
    }
  }
});
server.connection({ port: 3000 });

// Takes a relative path and prepends the protocol/host/port
var buildUrlWithPath = function (pathname) {
    return url.format({
        protocol: jira.protocol,
        hostname: jira.host,
        port: jira.port,
        pathname: pathname
    });

};

server.route({
  method: 'GET',
  path: '/',
  handler : function (request, reply) {
    // TODO: Render a template showing board links
  }
});

server.route({
  method: 'GET',
  path: '/program_status',
  handler : function (request, reply) {
      // Return Angular App teamplte 
  }
});
server.route({
  method: 'GET',
  path: '/jira/board_data/{board_id}',
  handler : function(request, reply) {
        //reply.file('src/server/example.json');
        var boardId = request.params.board_id;
        var board_status_url = buildUrlWithPath(
            "/rest/greenhopper/1.0/xboard/plan/backlog/data.json"
        );
        board_status_url = board_status_url + "?rapidViewId="+encodeURIComponent(boardId);
        console.log("Build Rest URL: "+board_status_url);
        // This wraps request library with auth configuraiton and response data will be parsed JSON if available
        jira.makeRequest({ method : 'GET', url : board_status_url }, function (error, data) {
            if (error) {
                console.log("Error: " + error);
                console.log(error);
                var response = reply(error);
                response.statusCode(500);
            } else {
                reply(data);
            }
        }); 
  }
});
server.route({
    method: 'PUT',
    path: '/jira/board_data/{board_id}/change_rank',
    handler : function (request, reply) {
        var issueKeys = request.payload.issueKeys;
        var beforeKey = request.payload.beforeKey;
        var afterKey = request.payload.afterKey;
        var customFieldId = request.payload.customFieldId; 
        console.log("Moving " + issueKeys[0] + " between " + beforeKey + " and " + afterKey);
        var change_rank_url = buildUrlWithPath("/rest/greenhopper/1.0/rank");
        jira.makeRequest({
            method: 'PUT',
            url : change_rank_url,
            json: true,
            body : {
                issueKeys : issueKeys,
                rankBeforeKey: beforeKey,
                rankAfterKey: afterKey,
                customFieldId : customFieldId
            }
        }, function (error, data) {
            if (error) {
                console.log("Error:");
                console.log(error);
                reply(error);
                reply.statusCode = 500;
            } else {
                reply(data);
            }
        });
        // PUT request to /rest/greenhopper/1.0/rank. The request body looks like:
        // {"issueKeys":["ANERDS-102"],"rankBeforeKey":"ANERDS-94","rankAfterKey":"
    }
});

server.register(Inert, function (err) { 
  server.route({
    method: 'GET',
    path: '/app/{param*}',
    handler: {
      directory: {
        path: 'client-dist',
        index: false,
        listing: true
      }
   }
  });

});

server.register({
  register: Good,
  options : {
    reporters: [{
      reporter: require('good-console'),
      events: {
        response: '*',
        log: '*'
      }
    }]
  }
}, function (err) {
  if (err) {
    throw err;
  }
  server.start(function() {
    console.log('Server running at:', server.info.uri);
  });

});

