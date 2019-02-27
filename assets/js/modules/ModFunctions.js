let mod_functions = ()=>{

    var $d = $(document), datetime = moment().format("YYYY-MM-DD HH:mm:ss"), db = null;

    if( window.openDatabase ){

        db = openDatabase('my_acess_db', '1.0', 'My access db', 5 * 1024 * 1024);
        console.log('Success to open database')
    }
    else{
        import('../first_login.js').then(function(first_login) { first_login.default(); });
    }

    window.loader_show = ()=>{
        $('#loader_block').show();
    }

    loader_show();

    window.loader_hide = ()=>{
        $('#loader_block').fadeOut(300);
    }


    window.nl2br = ( str, is_xhtml )=> {
        let breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
        return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
    }


    window.imageIsLoaded = ( e )=> {
        $('#add_img_loaded').html('<img src="'+e.target.result+'"/>');
    };

    window.upload_img = ( img, $this )=>{

        let imgsend = "default.png";

        if( img.length >= 1 ){

            if ($this.files && $this.files[0]) {

                let $thisfile       = $this.files[0]
                let originalfile    = $thisfile.path

                let filename        = $thisfile.name
                let filetype        = $thisfile.type
                let filesize        = $thisfile.size

                if( filetype == "image/png" || filetype == "image/jpeg" ){

                    copyFile(fs, path, originalfile, './upload/');

                    imgsend = filename;
                }
            }

        }

        return imgsend;
    }

    window.copyFile = ( fs, path, filesrc, dirupload )=>{

        let f       = path.basename(filesrc);
        let source  = fs.createReadStream(filesrc);
        let dest    = fs.createWriteStream(path.resolve(dirupload, f));

        source.pipe(dest);

        source.on('end', function() {

        });
        source.on('error', function(err) {
            console.log(err);
        });
    }

    window.backup_database = ( table )=> {

        let data = new Object();

        db.transaction(function(tx) {

            tx.executeSql("SELECT * FROM "+table, [], function( tx,results ) {

                if( results ){
                    $(results.rows).each(function(i,v){
                        data[i] = v
                    })
                    return data;
                }

                else{
                    return null;
                }
            });

        },null);
    }

    window.backup = (table)=> {

        var def = new $.Deferred();

        db.readTransaction(function(tx) {

            tx.executeSql("SELECT * FROM "+table, [], function(tx,results) {

                var data = results.rows

                def.resolve(data);
            });
        }, null);

        return def;
    }

    window.add_key_encryption = (str)=>{

        db.transaction(function(tx) {

            tx.executeSql("SELECT * FROM encryption", [], function(tx,results) {

                if( results.rows[0] ){
                    tx.executeSql('UPDATE encryption SET key=? where rowid=?', [str, 1]);
                }
                else{

                    tx.executeSql('INSERT INTO encryption (key) VALUES ("'+str+'")');
                }
            })
        })
    }

    window.encryption_state_value = (value)=>{

        db.transaction(function(tx) {

            if( value === "1"){
                tx.executeSql('UPDATE encryption SET state=? where rowid=?', ["1", 1]);

                tx.executeSql("SELECT key FROM encryption", [], function(tx,results) {
                    if( results.rows[0] ){
                        let key = results.rows[0].key;

                        crypt_data(key)
                    }
                })
            }

            if( value === "0" ){
                tx.executeSql('UPDATE encryption SET state=? where rowid=?', ["0", 1]);

                tx.executeSql("SELECT key FROM encryption", [], function(tx,results) {
                    if( results.rows[0] ){
                        let key = results.rows[0].key;
                        decrypt_data(key)
                    }
                })
            }
        })
    }

    window.crypt_data = (key)=>{

        db.transaction(function(tx) {

            tx.executeSql("SELECT rowid, * FROM datas", [], function(tx,results) {

                if( results ){

                    $.each(results.rows, function(k,v){

                        let description_encrypt = CryptoJS.AES.encrypt(v.description, key);
                            description_encrypt = description_encrypt.toString()

                        let id = v.rowid

                        if( v.encrypted === "0"){
                            tx.executeSql('UPDATE datas SET description=? where rowid=?', [description_encrypt, id]);
                            tx.executeSql('UPDATE datas SET encrypted=? where rowid=?', ["1", id]);
                        }
                    })
                }
            })
        })
    }

    window.decrypt_data = (key)=>{

        db.transaction(function(tx) {

            tx.executeSql("SELECT rowid, * FROM datas", [], function(tx,results) {

                if( results ){

                    $.each(results.rows, function(k,v){

                        let description_decrypt = CryptoJS.AES.decrypt(v.description, key);
                            description_decrypt = description_decrypt.toString(CryptoJS.enc.Utf8);

                        let id = v.rowid

                        if( v.encrypted === "1"){
                            tx.executeSql('UPDATE datas SET description=? where rowid=?', [description_decrypt, id]);
                            tx.executeSql('UPDATE datas SET encrypted=? where rowid=?', ["0", id]);
                        }
                    })
                }
            })

        })
    }

    window.backup_download = ()=>{

        //GET BACKUP DATA BASE
        let file = path.basename('/data')+"/datas.json";
        fs.exists(file, (exists) => {

            if( exists ){

                $('#result_export_database_file').show()

                fs.readFile(file, 'utf8', function (err, data) {

                    if(!err){
                        var download = "text/json;charset=utf-8," + encodeURIComponent(data);
                        $('<a href="data:' + download + '" download="datas.json">Download JSON file</a>').appendTo('#result_export_database_file');
                    }

                })
            }
        });
    }

    window.sync_data_check = (str)=>{

        var def = new $.Deferred();

        db.readTransaction(function(tx) {

            tx.executeSql("SELECT * FROM datas WHERE title=?", [str], function(tx,results) {

                if( results ){
                    let item = results.rows
                     def.resolve(item);
                }
                else{
                    def = "no_data";
                }
            });
        }, function( err ){
            console.log( err )
        });

        return def;
    }

    window.sync_data_insert = ( data )=>{

        let title           = data.title
        let description     = data.description
        let img             = "default.png"
        let position        = "0"
        let dateadd         = data.dateadd
        let dateupdate      = data.dateupdate
        let encrypted       = data.encrypted

        db.transaction(function(tx) {
            tx.executeSql("CREATE TABLE IF NOT EXISTS datas (title, description LONGTEXT, img, position, dateadd DATETIME, dateupdate DATETIME, encrypted VARCHAR NOT NULL DEFAULT '0', category VARCHAR NOT NULL DEFAULT '0')");
            tx.executeSql('INSERT INTO datas (title, description, img, position, dateadd, dateupdate, encrypted, category) VALUES ("'+title+'", "'+description+'", "'+img+'", "'+position+'", "'+dateadd+'", "'+dateupdate+'", "'+encrypted+'", "0")');
        })

        /*
        db.transaction(function(tx) {
            tx.executeSql('INSERT INTO datas (title, description, img, position, dateadd, dateupdate, encrypted) VALUES ("'+title+'", "'+description+'", "'+img+'", "'+position+'", "'+dateadd+'", "'+dateupdate+'", "'+encrypted+'")');
        })
        */
    }

    window.get_encryption =()=>{

        let data = new $.Deferred();

        db.transaction(function(tx) {

            tx.executeSql("CREATE TABLE IF NOT EXISTS encryption (key, state VARCHAR NOT NULL DEFAULT '0')");

            tx.executeSql("SELECT rowid, * FROM encryption", [], function(tx,results) {

                if( results.rows[0]){
                    data.resolve(results.rows[0])
                }
                else{
                    data.resolve('null')
                }

            })

        },function( err ){
            console.log(err)
            data.resolve('null')
        })

        return data;
    }


    window.get_synchronise_table = ()=>{

        let thekey = new $.Deferred();

        db.transaction(function (tx) {

            tx.executeSql("SELECT * FROM synchronize", [], function( tx,results ) {

                if( results ){
                    thekey.resolve(results.rows[0].key)
                }
                else{
                    thekey.resolve('null')
                }
            })

        }, function( err ){
            console.log( err )
            thekey.resolve('null')
        })

        return thekey;
    }

    window.generate_key = ()=> {
      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for (var i = 0; i < 50; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

      return text;
    }

    window.create_synchronise_table = ()=>{

        db.transaction(function (tx) {

            let key = generate_key()

            tx.executeSql('CREATE TABLE IF NOT EXISTS synchronize (key, active, datestart DATETIME)');

            tx.executeSql('INSERT INTO synchronize (key, active, datestart) VALUES ("'+key+'", "1", "'+datetime+'")');

            tx.executeSql('CREATE TABLE IF NOT EXISTS synchronize_autorized (key, ip, machine, dateadd DATETIME)');

            tx.executeSql('CREATE TABLE IF NOT EXISTS synchronize_log (ip, key, datelog DATETIME)');

            tx.executeSql("CREATE TABLE IF NOT EXISTS datas (title, description LONGTEXT, img, position, dateadd DATETIME, dateupdate DATETIME, encrypted VARCHAR NOT NULL DEFAULT '0', category VARCHAR NOT NULL DEFAULT '0')");

        }, function( err ){

            console.log( err )
        })

        return
    }

    window.delete_synchronise_table = ()=>{

        db.transaction(function (tx) {

            // FOR DEV...
            tx.executeSql("DROP TABLE synchronize",[],
                function(tx,results){ console.log("Successfully Dropped synchronize") },
                function(tx,error){ console.log("Could not delete synchronize") }
            );

            // FOR DEV...
            tx.executeSql("DROP TABLE synchronize_autorized",[],
                function(tx,results){ console.log("Successfully Dropped synchronize_autorized") },
                function(tx,error){ console.log("Could not delete synchronize_autorized") }
            );

            // FOR DEV...
            tx.executeSql("DROP TABLE synchronize_log",[],
                function(tx,results){ console.log("Successfully Dropped synchronize_log") },
                function(tx,error){ console.log("Could not delete synchronize_log") }
            );


        })
    }

    window.get_server_sync_on_start = (myIP)=>{

        let key = null;

        $.when( get_synchronise_table() ).then(function( thiskey ){

            if( thiskey != 'null' ){
                key = thiskey
                setTimeout(function(){ http_server_start(myIP, key) },1500)
            }

        });
    }


    window.item_sortable = ()=>{

        $( "#view_data" ).sortable({
            items: ".sortable_element",
            handle: ".the_grip",
            /*connectWith: ".category-view-item",*/
            opacity: 0.5,
            axis: "y",
            revert: true,
            stop: function(event, ui){

                $('.view-item').each(function(i, v) {

                    let position = i+1;

                    $(v).attr('data-position', i)
                    let rowid = $(v).attr('data-id')

                    //$(v).find('.item-position').text(position)

                    db.transaction(function(tx) {
                        tx.executeSql('UPDATE datas SET position=? WHERE rowid=?', [i, rowid]);
                    })
                })


                $('.view-category').each(function(k, e) {

                    let position = k+1;

                    $(e).attr('data-position', k)
                    let rowid = $(e).attr('data-id')

                    db.transaction(function(tx) {
                        tx.executeSql('UPDATE category SET position=? WHERE rowid=?', [k, rowid]);
                    })
                })

            }
        })
    }

    var targetID;

    window.item_droppable = ()=>{

        $( ".category-view-item" ).droppable({
            accept: ".view-item",
            hoverClass: "drop-hover",
            over: function( event, ui ) {
                $(event.target).addClass('dropped');
                targetID    = $(event.target).attr('data-id')
            },
            drop: function( event, ui ){

                targetID    = $(event.target).attr('data-id')
                let clone       = $(ui.draggable[0]).clone()

                $(ui.draggable[0]).addClass("ToRemove")

                let itemID = $(ui.draggable[0]).attr('data-id')

                let check = $('.category-view-item[data-id="'+targetID+'"]').find('.ui-sortable-placeholder')

                if( check.length !=1 ){
                    $('.category-view-item[data-id="'+targetID+'"]').append(clone)
                }
                else{
                    $(clone).insertBefore('.ui-sortable-placeholder')
                    $('.ui-sortable-placeholder').hide()
                }

                $(clone).removeAttr('style')

                $('.ToRemove').remove()

                $('.category-view-item').removeClass('dropped')

                db.transaction(function(tx) {

                    tx.executeSql('UPDATE datas SET category=? WHERE rowid=?', [targetID, itemID])
                })

                get_item_in_category()
            },
            out: function( event, ui ) {

                let itemID = $(ui.draggable[0]).attr('data-id')

                $('.ui-sortable-placeholder').show()

                db.transaction(function(tx) {
                    tx.executeSql('UPDATE datas SET category=? WHERE rowid=?', ["0", itemID]);
                })
            }
        });

    }

    window.search_script = ()=>{
        /**************************************************
            FILTER SEARCH KEYWORDS
        **************************************************/
        jQuery.expr[':'].icontains = function(a, i, m) {
            var rExps=[
                {re: /[\xC0-\xC6]/g, ch: "A"},
                {re: /[\xE0-\xE6]/g, ch: "a"},
                {re: /[\xC8-\xCB]/g, ch: "E"},
                {re: /[\xE8-\xEB]/g, ch: "e"},
                {re: /[\xCC-\xCF]/g, ch: "I"},
                {re: /[\xEC-\xEF]/g, ch: "i"},
                {re: /[\xD2-\xD6]/g, ch: "O"},
                {re: /[\xF2-\xF6]/g, ch: "o"},
                {re: /[\xD9-\xDC]/g, ch: "U"},
                {re: /[\xF9-\xFC]/g, ch: "u"},
                {re: /[\xC7-\xE7]/g, ch: "c"},
                {re: /[\xD1]/g, ch: "N"},
                {re: /[\xF1]/g, ch: "n"}
            ];

            var element = $(a).text();
            var search = m[3];

            $.each(rExps, function() {
                element = element.replace(this.re, this.ch);
                search = search.replace(this.re, this.ch);
            });

            return element.toUpperCase().indexOf(search.toUpperCase()) >= 0;
        };
        /* ..SEARCH.. */
        $d.off('keyup', '#item_filter_keywords').on('keyup', '#item_filter_keywords', function(){

            $('.keyword_data').removeClass('result_contains')

            var searchvalue = $(this).val()

            if( searchvalue.length >= 2 ){

                $('.keyword_data').hide()

                var keyword = $('.keyword_data:icontains("'+searchvalue+'")').show().addClass('result_contains')

                $('.category-view-item').each(function(k,v){

                    let category_id = $(v).attr('data-id')

                    let nbItem = $(v).find('.result_contains').length

                    if( nbItem == 0){
                        $('.view-category[data-id="'+category_id+'"]').hide()
                    }
                })


            }
            else{
                $('.view-category').show()
                $('.keyword_data').show().removeClass('result_contains')
                $('.keyword_data').show()
                //$('.modal-title-content').show()
            }
        });
        /**************************************************
            END -- FILTER SEARCH KEYWORDS
        **************************************************/
    }

    window.load_category = ( order = "ASC" )=>{

        $('.view_show_all_category').css('transform','rotate(45deg)')

        db.transaction(function(tx) {

            tx.executeSql('SELECT rowid, * FROM category ORDER BY position '+ order, [], function (tx, results) {

                if( results.rows ){

                    let data        = results.rows;

                    $(data).each(function(i, v) {

                        let category =
                            '<div data-id="'+v.rowid+'" data-position="'+v.position+'" class="view-category">'+
                                '<div class="title-block">'+
                                    '<div data-id="'+v.rowid+'" class="category-hide"><i class="fa fa-angle-down" aria-hidden="true"></i></div>'+
                                    '<div class="img-category"><img src="/upload/'+v.img+'"></div>'+
                                    '<div class="title-category">'+v.title+'</div>'+
                                    '<div class="category-btn"><i data-id="'+v.rowid+'" class="fa fa-trash category_item_delete" aria-hidden="true"></i></div>'+
                                    '<div class="category-btn"><i data-id="'+v.rowid+'" class="fa fa-pencil category_item_edit" aria-hidden="true"></i></div>'+
                                '</div>'+

                                '<div data-id="'+v.rowid+'" class="category-delete-confirmation">'+
                                    '<div class="category_confirm_delete">DELETE</div><div class="category_cancel_delete">CANCEL</div>'+
                                '</div>'+

                                '<div data-id="'+v.rowid+'" class="category-view-item"></div>'
                            '</div>';


                        $('#view_data').append(category)

                        $('.category-hide[data-id="'+v.rowid+'"]').children('i').css('transform','rotate(45deg)')

                    })
                }

            })

        })
    }


    window.load_data = ( order="ASC" )=>{

        load_category()

        setTimeout(function(){

            db.transaction(function(tx) {

                let key = "";
                tx.executeSql("SELECT key FROM encryption", [], function(tx,results) {

                    if( results.rows[0] ){
                        key = results.rows[0].key;
                    }
                })


                tx.executeSql('SELECT rowid, * FROM datas ORDER BY position '+ order, [], function (tx, results) {

                    if( results.rows ){

                        let data        = results.rows;

                        $(data).each(function(i, v) {

                            var description = v.description

                            if( v.encrypted === "1" ){


                                description = CryptoJS.AES.decrypt(v.description, key);
                                description = description.toString(CryptoJS.enc.Utf8);

                                let item =
                                    '<div data-id="'+v.rowid+'" data-position="'+v.position+'" class="view-item keyword_data sortable_element">'+

                                        '<div class="nav-item">'+
                                            '<div data-id="'+v.rowid+'" class="hide-item"><i class="fa fa-ellipsis-h" aria-hidden="true"></i></div>'+
                                            '<div class="title-item">'+v.title+'</div>'+
                                            '<div data-id="'+v.rowid+'" class="grip-notice">Drag me..</div>'+
                                            '<div data-id="'+v.rowid+'" class="grip the_grip"><i class="fa fa-paw" aria-hidden="true"></i></div>'+
                                            '<div class="btn-nav"><i data-id="'+v.rowid+'" class="fa fa-trash view_item_delete" aria-hidden="true"></i></div>'+
                                            '<div class="btn-nav"><i data-id="'+v.rowid+'" class="fa fa-pencil view_item_edit" aria-hidden="true"></i></div>'+
                                        '</div>'+

                                        '<div data-id="'+v.rowid+'" class="item-delete-confirmation">'+
                                            '<div class="item_confirm_delete">DELETE</div><div class="item_cancel_delete">CANCEL</div>'+
                                        '</div>'+

                                        '<div data-id="'+v.rowid+'" class="description-item">'+
                                            '<div class="img"><img src="/upload/'+v.img+'" alt="" /></div>'+
                                            '<div class="text">'+description+'</div>'+
                                        '</div>'+
                                        '<div class="date-item">'+
                                            '<div class="item-encrypt">Encrypted..</div>'+
                                            '<div class="item-position">'+position+'</div>'+
                                            '<div class="date-up">Updated : '+v.dateupdate+'</div>'+
                                        '</div>'+

                                    '</div>';

                                if( v.category != "0"){

                                    if( $('.category-view-item[data-id="'+v.category+'"]').is(':visible') ){

                                        $('.category-view-item[data-id="'+v.category+'"]').append(item)
                                    }
                                    else{

                                       $('#view_data').append(item)
                                    }
                                }
                                else{
                                   $('#view_data').append(item)
                                }

                            }
                            else{
                                let item =
                                    '<div data-id="'+v.rowid+'" data-position="'+v.position+'" class="view-item keyword_data sortable_element">'+

                                        '<div class="nav-item">'+
                                            '<div data-id="'+v.rowid+'" class="hide-item"><i class="fa fa-ellipsis-h" aria-hidden="true"></i></div>'+
                                            '<div class="title-item">'+v.title+'</div>'+
                                            '<div data-id="'+v.rowid+'" class="grip-notice">Drag me..</div>'+
                                            '<div data-id="'+v.rowid+'" class="grip the_grip"><i class="fa fa-paw" aria-hidden="true"></i></div>'+
                                            '<div class="btn-nav"><i data-id="'+v.rowid+'" class="fa fa-trash view_item_delete" aria-hidden="true"></i></div>'+
                                            '<div class="btn-nav"><i data-id="'+v.rowid+'" class="fa fa-pencil view_item_edit" aria-hidden="true"></i></div>'+
                                        '</div>'+

                                        '<div data-id="'+v.rowid+'" class="item-delete-confirmation">'+
                                            '<div class="item_confirm_delete">DELETE</div><div class="item_cancel_delete">CANCEL</div>'+
                                        '</div>'+

                                        '<div data-id="'+v.rowid+'" class="description-item">'+
                                            '<div class="img"><img src="/upload/'+v.img+'" alt="" /></div>'+
                                            '<div class="text">'+description+'</div>'+
                                        '</div>'+
                                        '<div class="date-item">'+
                                            '<div class="item-encrypt">Not encrypted..</div>'+
                                            '<div class="item-position">'+position+'</div>'+
                                            '<div class="date-up">Updated : '+v.dateupdate+'</div>'+
                                        '</div>'+

                                    '</div>';

                                if( v.category != "0"){

                                    if( $('.category-view-item[data-id="'+v.category+'"]').is(':visible') ){

                                        $('.category-view-item[data-id="'+v.category+'"]').append(item)
                                    }
                                    else{
                                       $('#view_data').append(item)
                                    }
                                }

                                else{
                                   $('#view_data').append(item)
                                }
                            }

                            let position = i+1;

                            tx.executeSql('UPDATE datas SET position=? WHERE rowid=?', [i, v.rowid]);
                        });

                        item_sortable();

                        search_script();

                        setTimeout(function(){

                            loader_hide()

                        },500)

                        setTimeout(function(){

                            item_droppable()

                            get_item_in_category()

                        },2000)


                    }
                });
            })

        },700)
    }


    window.get_item_in_category = ()=>{

        let lengthItem = 0, categoryID;

        $('.category-view-item').each(function(k, v){

            categoryID = $(v).attr('data-id')
            lengthItem = $(v).find('.view-item').length

            if( lengthItem <= 0 ){
                $('.category_item_delete[data-id="'+categoryID+'"]').show()
            }
            else{
                $('.category_item_delete[data-id="'+categoryID+'"]').hide()
            }
        })
    }


    /***********************************************
        **FOR DEV**
    ***********************************************/
        let add_column = ()=>{


            db.transaction(function(tx) {

                tx.executeSql("SELECT encrypted FROM datas", [], function( tx,results ) {})

            }, function(err){
                console.log( err )
                if( err.message === "could not prepare statement (1 no such column: encrypted)"){
                    db.transaction(function(tx) {
                        tx.executeSql("ALTER TABLE datas ADD encrypted VARCHAR NOT NULL DEFAULT '0' ")
                    })
                }
            })


            db.transaction(function(tx) {

                tx.executeSql("SELECT category FROM datas", [], function( tx,results ) {})

            }, function(err){
                console.log( err )
                if( err.message === "could not prepare statement (1 no such column: category)"){
                    db.transaction(function(tx) {
                        tx.executeSql("ALTER TABLE datas ADD category VARCHAR NOT NULL DEFAULT '0' ")
                    })
                }
            })



            db.transaction(function(tx) {

                tx.executeSql("SELECT state FROM encryption", [], function( tx,results ) {})

            }, function(err){
                console.log( err )
                if( err.message === "could not prepare statement (1 no such column: state)"){
                    db.transaction(function(tx) {
                        tx.executeSql("ALTER TABLE encryption ADD state VARCHAR NOT NULL DEFAULT '0' ")
                    })
                }
            })

        }
        add_column()
    /***********************************************
        END **FOR DEV**
    ***********************************************/

}
export default mod_functions
