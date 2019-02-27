import css from '../sass/style.scss'


let get_data_user = ()=>{

    if( window.openDatabase ){

        var db = openDatabase('my_acess_db', '1.0', 'My access db', 5 * 1024 * 1024);

        db.transaction(function (tx) {

            tx.executeSql('SELECT * FROM user', [], function (tx, results) {

                if( results.rows[0] ){

                    let datadb = results.rows[0];

                    if( datadb.remember != "1" ){
                        import('./login.js').then(function(login) { login.default(); });
                    }
                    else{

                        import('./modules/ModFunctions.js').then(function(ModFunctions) {
                            ModFunctions.default();
                        });

                        setTimeout(function(){ import('./app.js').then(function(app) { app.default(); }); },500)
                    }
                }
                else{
                    import('./first_login.js').then(function(first_login) { first_login.default(); });
                }

            }, function(tx, err){

                console.log( err )

                import('./first_login.js').then(function(first_login) { first_login.default(); });

            });
        });
    }
    else{

        import('./first_login.js').then(function(first_login) { first_login.default(); })

    }
}

let delete_user_db = ()=>{

    var db = openDatabase('my_acess_db', '1.0', 'My access db', 5 * 1024 * 1024);

    db.transaction(function (tx) {

        // FOR DEV...
        tx.executeSql("DROP TABLE user",[],
            function(tx,results){ console.log("Successfully Dropped") },
            function(tx,error){ console.log("Could not delete") }
        );


    })
}

let delete_data_db = ()=>{

    var db = openDatabase('my_acess_db', '1.0', 'My access db', 5 * 1024 * 1024);

    db.transaction(function (tx) {

        // FOR DEV...

        tx.executeSql("DROP TABLE datas",[],
            function(tx,results){ console.log("Successfully Dropped") },
            function(tx,error){ console.log("Could not delete") }
        );


    })
}


jQuery( function( $ ){

    let $d = $(document);

    //$('#app_nav').hide()

    $d.ready(function(){

        get_data_user();
        //delete_user_db();
        //delete_data_db();
    })

})



