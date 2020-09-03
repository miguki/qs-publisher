var qrsInteract = require('qrs-interact');
var config = require(process.argv[2])
var qrsInteracter = new qrsInteract(config);
var newAppConfig = require(process.argv[3])
var http = require('http');
var statusCodes = http.STATUS_CODES

var consoleWrite = function (text) {
    process.stdout.write(text + '.'.repeat(90 - text.length))
}

var copyApp = function (appId, appName) {
    return new Promise(function (resolve, reject) {
        console.log('\nApp name: ' + appName)
        consoleWrite('Copying app ' + appId)
        qrsInteracter.Post(
            'app/' + appId + '/copy?name=' + appName,
            '',
            'json'
        ).then(function (result) {
            console.log(result.statusCode.toString() + ' ' + statusCodes[result.statusCode.toString()])
            console.log('New app id: ' + result.body.id)
            resolve(result.body.id)

        }).catch(function (error) {
            console.log(error);
            reject(error)
        });
    })
}

var listSheets = function (appId) {
    return new Promise(function (resolve, reject) {
        consoleWrite('Listing sheets in app ' + appId)
        qrsInteracter.Get('app/object/full?filter=app.id eq ' + appId + ' and objectType eq \'sheet\'').then(function (result) {
            console.log(result.statusCode.toString() + ' ' + statusCodes[result.statusCode.toString()])
            resolve(result.body)
        }).catch(function (error) {
            console.log(error);
            reject(error)
        });
    })
}

var replaceApp = function (appId, replacedAppId) {
    return new Promise(function (resolve, reject) {
        consoleWrite('Replacing ' + replacedAppId + ' with ' + appId)
        qrsInteracter.Put(
            'app/' + appId + '/replace?app=' + replacedAppId,
            ''
        ).then(function (result) {
            console.log(result.statusCode.toString() + ' ' + statusCodes[result.statusCode.toString()])
            resolve(result.body)

        }).catch(function (error) {
            console.log(error);
            reject(error)
        });
    })
}

var deleteApp = function (appId) {
    return new Promise(function (resolve, reject) {
        consoleWrite('Deleting app ' + appId)
        qrsInteracter.Delete(
            'app/' + appId
        ).then(function (reply) {
            console.log(reply.statusCode.toString() + ' ' + statusCodes[reply.statusCode.toString()])
            resolve()
        }).catch(function (error) {
            console.log(error);
            reject(error)
        });
    })
}

var deleteSheet = function (objectId) {
    return new Promise(function (resolve, reject) {
        consoleWrite('Deleting sheet ' + objectId)
        qrsInteracter.Delete(
            'app/object/' + objectId
        ).then(function (reply) {
            console.log(reply.statusCode.toString() + ' ' + statusCodes[reply.statusCode.toString()])
            resolve()
        }).catch(function (error) {
            console.log(error);
            reject(error)
        });
    })
}

var listSheetsToRemove = function (sheetList, sheetNamesToLeave) {
    return sheetList.filter(ar => !sheetNamesToLeave.find(rm => (rm === ar.name)))
}

async function deleteSheets(sheetList, sheetNamesToLeave) {
    var sheetsToRemove = listSheetsToRemove(sheetList, sheetNamesToLeave)
    for (sheet of sheetsToRemove) {
        await deleteSheet(sheet.id)
    };
}

var createApp = function (newAppConfig) {
    return new Promise(function (resolve, reject) {
        copyApp(newAppConfig.sourceAppId, newAppConfig.name).then(function (result) {
            var newAppId = result
            listSheets(newAppId).then(sheetList => deleteSheets(sheetList, newAppConfig.sheetNames).then(function () {
                replaceApp(newAppId, newAppConfig.replacedAppId).then(function () {
                    deleteApp(newAppId).then(function () {
                        resolve()
                    }).catch(function (error) {
                        console.log(error)
                        reject(error)
                    })
                }).catch(function (error) {
                    console.log(error)
                    reject(error)
                })
            }).catch(function (error) {
                console.log(error)
            })
            ).catch(function (error) {
                console.log(error)
            })
        }).catch(function (error) {
            console.log(error)
        })
    })
}

async function publish(appConfig) {
    for (newApp of appConfig.newApps) {
        await createApp(newApp)
    }
    console.log('\nDone')
}

publish(newAppConfig)