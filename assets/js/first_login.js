let first_login = function(){

    let $d = $(document)

    $('.nav-btn').hide()
    $('.nav-disconnect').hide()
    $('.icon-login').fadeIn(300)

    $.post('/templates/first_login.html', function( data ){
        $('#template_load').html( data )
    })

    $d.off('submit', '#form_first_login').on('submit', '#form_first_login', function( e ){

        e.preventDefault()

        let login               = $('input[name="new_login"]').val(),
            email               = $('input[name="new_email"]').val(),
            password            = $('input[name="new_password"]').val(),
            confim_password     = $('input[name="new_confirm_password"]').val()

        if( login.length >=1 && email.length >=1 && password.length >=1 && confim_password.length >=1 ){

            if( password == confim_password ){

                let salt    = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                let token   = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

                var encrypted       = CryptoJS.AES.encrypt(password, salt);
                    encrypted       = encrypted.toString()

                if( window.openDatabase ){

                    var db = openDatabase('my_acess_db', '1.0', 'My access db', 5 * 1024 * 1024);

                    db.transaction(function (tx) {

                        tx.executeSql('CREATE TABLE IF NOT EXISTS user (login, email, salt, pass, token, remember)');

                        tx.executeSql('INSERT INTO user (login, email, salt, pass, token, remember) VALUES ("'+login+'", "'+email+'", "'+salt+'", "'+encrypted+'", "'+token+'", "0")');

                        db.transaction(function (tx){

                        tx.executeSql('SELECT * FROM user', [], function (tx, results) {

                            if( results ){
                                import('./login.js').then(function(login) { login.default(); });
                            }
                            else{
                                import('./first_login.js').then(function(first_login) { first_login.default(); });
                            }

                        }, function(tx, err){
                            import('./first_login.js').then(function(first_login) { first_login.default(); });
                        });
                    });

                    }, function( err ){
                        console.log( err )
                    });

                }
                else{
                    console.log( 'no data base')
                }
            }
            else{
                console.log('pass not good')
            }
        }
        else{
            console.log( 'error length form data')
        }
    })

}
export default first_login
