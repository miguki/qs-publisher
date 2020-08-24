var qrsInteract = require('qrs-interact');
var http = require('http');

var config = {
    hostname: 'sense.datawizards.pl',
    portNumber: 4242,
    virtualProxyPrefix: "",
    localCertPath: 'C:/Users/jans/Desktop/Certs',
    repoAccount: 'UserDirectory=WIN-50635PQO9HR;UserId=jan',
};

var statusCodes = http.STATUS_CODES

var qrsInteracter = new qrsInteract(config);

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
            // console.log(result.body);
            console.log('New app id: ' + result.body.id)
            resolve(result.body.id)

        }).catch(function (error) {
            // console.log(error);
            reject(error)
        });
    })
}

var listSheets = function (appId) {
    return new Promise(function (resolve, reject) {
        consoleWrite('Listing sheets in app ' + appId)
        qrsInteracter.Get('app/object/full?filter=app.id eq ' + appId + ' and objectType eq \'sheet\'').then(function (result) {
            console.log(result.statusCode.toString() + ' ' + statusCodes[result.statusCode.toString()])
            // console.log(result.body);
            resolve(result.body)
        }).catch(function (error) {
            // console.log(error);
            reject(error)
        });
    })
}

var replaceApp = function (appId, replacedAppId) {
    return new Promise(function (resolve, reject) {
        consoleWrite('Replacing ' + appId + ' with ' + replacedAppId)
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

var deleteSheet = function (objectId) {
    return new Promise(function (resolve, reject) {
        consoleWrite('Deleting sheet ' + objectId)
        qrsInteracter.Delete(
            'app/object/' + objectId
        ).then(function (statusCode) {
            console.log(statusCode.toString() + ' ' + statusCodes[statusCode.toString()])
            resolve()
        }).catch(function (error) {
            // console.log(error);
            reject(error)
        });
    })
}

var listSheetsToRemove = function (sheetList, sheetNamesToLeave) {
    return sheetList.filter(ar => !sheetNamesToLeave.find(rm => (rm === ar.name)))
}

var newAppConfig = {
    newApps: [
        {
            sourceAppId: '388a1695-e268-414a-a1cb-53bd7a72c4e8',
            name: 'App 01',
            replacedAppId: '9b61a1c3-9118-4dbb-9285-5f8453ffc222',
            sheetNames: [
                'Sheet 01',
                'Sheet 02'
            ]
        },
        {
            sourceAppId: '388a1695-e268-414a-a1cb-53bd7a72c4e8',
            name: 'App 02',
            replacedAppId: 'd08b85ff-c2e9-4722-8818-1aa59cba9480',
            sheetNames: [
                'Sheet 03',
                'Sheet 04'
            ]
        }
    ]
}

async function deleteSheets(sheetList, sheetNamesToLeave) {
    var sheetsToRemove = listSheetsToRemove(sheetList, sheetNamesToLeave)
    for (sheet of sheetsToRemove) {
        await deleteSheet(sheet.id)
    };
}

async function publish(appConfig) {
    for(newApp of appConfig.newApps){
        await createApp(newApp)
    }
    console.log('\nDone')
}

var createApp = function(newAppConfig){
    return new Promise(function(resolve, reject){
        copyApp(newAppConfig.sourceAppId, newAppConfig.name).then(function (result) {
            var newAppId = result
            listSheets(newAppId).then(sheetList => deleteSheets(sheetList, newAppConfig.sheetNames).then(function () {
                replaceApp(newAppId, newAppConfig.replacedAppId).then(function(){
                    resolve()
                }).catch(function (error) {
                    console.log(error)
                    reject(error)
                })
            })).catch(function (error) {
                console.log(error)
            })
        }).catch(function (error) {
            console.log(error)
        })
    })
}

publish(newAppConfig)