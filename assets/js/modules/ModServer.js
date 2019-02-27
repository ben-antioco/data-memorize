const fs    = require('fs');
const path  = require('path');
const express = require('express');

let synckey;

let sync_get_key = ()=>{

    if( window.openDatabase ){

        var db = openDatabase('my_acess_db', '1.0', 'My access db', 5 * 1024 * 1024);

        db.transaction(function (tx) {

            tx.executeSql("SELECT * FROM synchronize", [], function( tx,results ) {

                if( results ){
                    synckey = results.rows[0].key
                }
            })

        }, function( err ){
            console.log(err)
        })

        return synckey;
    }
}
sync_get_key()


let sync_get_data = ()=>{

    if( window.openDatabase ){

        var db = openDatabase('my_acess_db', '1.0', 'My access db', 5 * 1024 * 1024);

        let data = []

        db.transaction(function(tx) {

            tx.executeSql('SELECT rowid, * FROM datas ORDER BY position ASC', [], function (tx, results) {

                if( results.rows ){

                    $(results.rows).each(function(i, v) {
                        //data[i] = v
                        data.push(v)
                    });
                }
            });
        });

        return data;
    }
}


let sync_get_data_json = ()=>{

    var def = new $.Deferred();

    if( window.openDatabase ){

        var db = openDatabase('my_acess_db', '1.0', 'My access db', 5 * 1024 * 1024);

        db.readTransaction(function(tx) {

            tx.executeSql("SELECT * FROM datas ORDER BY position ASC", [], function(tx,results) {
                var data = results.rows

                def.resolve(data);
            });
        }, null);
    }

    return def;
}

// WEB SERVER..
let http_server_start = ( localIP, key )=>{

    console.log('*** Express server START ***')

    let hostname    = localIP;
    let port        = 3000;
    let app         = express();

    var TheRouter   = express.Router();

    TheRouter.route('/'+key)
    .get(function(req,res){

        let data;

        $.when(
            sync_get_data_json("datas")
        ).then(function( datas ){

            let datadatas = {datas:datas};
            res.json( datadatas )

        });
    })
    .post(function(req,res){
        //res.json({message : "Ajoute une nouvelle piscine à la liste", methode : req.method});
    })
    .put(function(req,res){
        //res.json({message : "Mise à jour des informations d'une piscine dans la liste", methode : req.method});
    })
    .delete(function(req,res){
        //res.json({message : "Suppression d'une piscine dans la liste", methode : req.method});
    });

    app.use(TheRouter);

    app.listen(port, hostname, function(){
        console.log("*** SERVER SYNC LINK ***\nhttp://"+ hostname +":"+port+"/"+key+"\n");
    });

}

let http_server_stop = ()=>{

    let app     = express();
    let server  = app.listen(3000);

    let serverStop = function() {
      server.close();
      console.log('*** Express server STOP ***')
    };

    serverStop()
}


