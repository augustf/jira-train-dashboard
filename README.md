#JIRA Train Dashboard
========

A dashboard of JIRA epics form a JIRA board
Takes a BoardID and allows:
- Birds eye view of progress for each epic in the order they are in the backlog
- Quickly re-rank epics across the large list (drag and drop is great in JIRA for moving +/- 10 issues, but painful when reranking across 100+ epics)

Inspired by a view in Rally/JIRA portfolio. Not nearly as advanced.
Also an excuse to learn angular, gulp, bower, bootstrap.

##Prerequisite

* nodejs http://www.nodejs.org/download/ install the 32bit version if you want to use AppBuilder too
* bower (npm install -g bower)
* gulp (npm install -g gulp)

## Setup
* npm install
* bower install
* Create src/server/jira.config.json
  Add host and authentication options
{
    host: 'www.example.com',
    basic_auth: { 
        "username": "jira-name",
        "password": "password"
    }
}

##Useful commands
* `gulp build` *builds and minifiy the assests*
* `node src/server/app.js`

