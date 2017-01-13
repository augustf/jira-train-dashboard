(function() {
    'use strict';
    // Split files later
    var app = angular.module('jtb', ['ui.bootstrap']);

    app.factory('jiraDataService', ['$http', function ($http) {
        var jiraDataService = {
            getEpicStats : function(boardId) {
                return $http.get('/jira/board_data/' + encodeURIComponent(boardId));
            },
            changeRank : function(boardId, rankFieldId, keys, afterKey, beforeKey) {
                var data = {
                    customFieldId: rankFieldId,
                    issueKeys : keys,
                    afterKey : afterKey,
                    beforeKey : beforeKey
                };
                return $http.put('/jira/board_data/' + encodeURIComponent(boardId) + '/change_rank', data);
            }
        };
        return jiraDataService;
    }]);
    app.factory('jiraDataCache', ['jiraDataService', '$rootScope', function (jiraDataService, $rootScope) {
        var jiraDataCache = {
            boardStats : {
                epics : []
            },
            getEpics : function () {
                return this.boardData.epicData.epics;
            },
            resetBoardData : function () {
                this.boardData = {
                    epicData : {
                        epics : []
                    }
                };
            },
            changeBoard : function (boardId) {
                this.boardId = boardId;
                this.resetBoardData();
                var self = this;
                jiraDataService.getEpicStats(this.boardId).then(
                    function(response) {
                        self.boardData = response.data;
                        self.notify();
                    },
                    function (response) {
                        alert('Failed to get JIRA Epic Stats: ' + response.status + ' ' + response.statusText);
                    });
                return [];
            },
            changeRank : function (currentRank, moveRank) {
                var self = this;
                var afterKey = '', beforeKey = '', currentKey = '';
                var ranks = this.calculateAfterBeforeRanks(currentRank, moveRank);
                if (ranks.afterRank >= 0 && ranks.afterRank < this.boardData.epicData.epics.length) {
                    afterKey = this.boardData.epicData.epics[ranks.afterRank].key;
                }
                if (ranks.beforeRank >= 0 && ranks.beforeRank < this.boardData.epicData.epics.length) {
                    beforeKey = this.boardData.epicData.epics[ranks.beforeRank].key;
                }
                currentKey = this.boardData.epicData.epics[currentRank].key;
                // Save off important data after clearing the board...
                var rankCustomFieldId = this.boardData.rankCustomFieldId;

                // Wipe..
                this.resetBoardData();
                this.notify();
                jiraDataService.changeRank(this.boardId, rankCustomFieldId,
                                            [currentKey], afterKey, beforeKey).then(
                    function (response) {
                        alert('ChangeRank Ok!');
                        self.changeBoard(self.boardId);
                    },
                    function (response) {
                        alert('ChangeRank NOT ok');
                    }
                );
            },
            calculateAfterBeforeRanks : function (currentRank, moveRank) {
                var afterRank, beforeRank;
                // A..B..C
                // B occurs after A and before C
                if (moveRank > 0) {
                    afterRank = currentRank + moveRank;
                    // Edge case we say move rank by 1 beforeRank needs to be not the current epic
                    beforeRank = 1 + currentRank + moveRank;
                } else if (moveRank < 0) {
                    afterRank = currentRank + moveRank - 1;
                    beforeRank = currentRank + moveRank;
                } else {
                    afterRank = currentRank - 1;
                    beforeRank = currentRank + 1;
                }
                return {
                    afterRank: afterRank,
                    beforeRank: beforeRank
                };
            },
            subscribe: function(scope, callback) {
                var handler = $rootScope.$on('jtb.epic-list', callback);
                scope.$on('$destroy', handler);
            },
            notify: function() {
                $rootScope.$emit('jtb.epic-list');
            }
        };
        return jiraDataCache;
    }]);
    app.controller('MainController', ['jiraDataCache', '$uibModal', '$scope', '$timeout',
        function(jiraDataCache, $uibModal, $scope, $timeout) {
        var self = this;
        this.boardId = '1098';
        this.epics = [];
        this.reloadBoard = function () {
            //this.epics = [];
            jiraDataCache.changeBoard(this.boardId);
        };
        jiraDataCache.subscribe($scope, function () {
            self.epics = jiraDataCache.getEpics();
        });
        this.openChangeRankModal = function (currentRank) {
            var modalInstance = $uibModal.open({
                templateUrl: 'changeRankModal.html',
                controller: 'ChangeRankInstanceController',
                controllerAs: 'modal',
                bindToController : true,
                size: 'lg',
                resolve: {
                    epics: function () {
                        return self.epics;
                    },
                    currentRank: function () {
                        return currentRank;
                    }
                }
            });
            modalInstance.result.then(function (moveRank) {
                alert('Changing rank ' + currentRank + ' moves ' + moveRank);
                jiraDataCache.changeRank(currentRank, moveRank);
            }, function () {
                //Dismissed: NOOFieldP
            });
        };
        //
        //Controller Initialization
        //

        this.reloadBoard();
    }]);
    //Note $modalInstance will be renamed $uibModalInstance soon...
    app.controller('ChangeRankInstanceController', ['$modalInstance', 'jiraDataCache', 'currentRank',
        function($uibModalInstance, jiraDataCache, currentRank) {
        this.currentRank = currentRank;
        this.moveRank = 0;
        this.epics = jiraDataCache.getEpics();
        this.getAfterRank = function () {
            var ranks = jiraDataCache.calculateAfterBeforeRanks(this.currentRank, this.moveRank);
            return ranks.afterRank;
        };
        this.getBeforeRank = function () {
            var ranks = jiraDataCache.calculateAfterBeforeRanks(this.currentRank, this.moveRank);
            return ranks.beforeRank;
        };
        this.update = function () {
            $uibModalInstance.close(this.moveRank);
        };
        this.close = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }]);
})();
