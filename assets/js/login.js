let login = function(){

    let $d = $(document)

    $('.nav-btn').hide()
    $('.nav-disconnect').hide()
    $('.icon-login').fadeIn(300)

    $.post('/templates/login.html', function( data ){
        $('#template_load').html( data )
        $('input').val('')
    })

    $d.off('submit', '#form_login').on('submit', '#form_login', function( e ){

        e.preventDefault()

        let login       = $('input[name="user_login"]').val()
        let password    = $('input[name="user_password"]').val()
        let remember    = $('input[name="user_remember"]').prop('checked')

        if( window.openDatabase ){

            var db = openDatabase('my_acess_db', '1.0', 'My access db', 5 * 1024 * 1024);

            db.transaction(function (tx) {

                tx.executeSql('SELECT * FROM user', [], function (tx, results) {

                    if( results.rows[0] ){

                        let datadb          = results.rows[0];

                        let logindb         = datadb.login
                        let saltdb          = datadb.salt
                        let passdb          = datadb.pass

                        var decryptedData = CryptoJS.AES.decrypt(passdb, saltdb);
                        var decrypted = decryptedData.toString(CryptoJS.enc.Utf8);

                        if( (logindb == login) && (decrypted == password) ){

                            if( remember === true ){
                                tx.executeSql('UPDATE user SET remember=? where rowid=?', ["1", 1]);
                            }
                            else{
                                tx.executeSql('UPDATE user SET remember=? where rowid=?', ["0", 1]);
                            }

                            import('./app.js').then(function(app) {
                                app.default()
                            })
                        }
                        else{
                            alert( 'not ok' )
                        }

                    }
                    else{
                        console.log("error");
                    }

                }, null);
            });
        }
        else{
            console.log('fail to open database')
        }

    })


    window.login_user = function(){

        if( window.openDatabase ){

            var db = openDatabase('my_acess_db', '1.0', 'My access db', 5 * 1024 * 1024);

            db.transaction(function (tx) {

                tx.executeSql('SELECT * FROM user', [], function (tx, results) {

                    if( results.rows[0] ){

                        let datadb = results.rows[0];

                        return datadb;

                    }
                    else{
                        return "error";
                    }

                }, null);
            });
        }
        else{
            console.log('fail to open database')
        }
    }

}
export default login

