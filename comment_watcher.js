class CommentWatcher {

    constructor(sub){
        this.sub = sub;
        this.last_comment = null;
        this.last_post    = null;
    }

    
    get(cb){
        var result_comment = null;
        var result_post = null;

        this.get_comments( this.sub , this.last_comment , (comment_times , last )=>{
            result_comment = comment_times;
            this.last_comment = last;
        });

        this.get_posts( this.sub , this.last_post , (post_times, last )=>{
            result_post = post_times;
            this.last_post = last;
        });

       function wait(){
            if( result_post == null || result_comment == null) {
                setTimeout( wait , 200 );
            } else {
                var result1 = result_comment.concat( result_post ).sort((a,b)=>{
                    return (b[1] - a[1]);
                });
                var result2 = result1.map( a => a[0] );
                var result3 = result2.slice(0,25);
                console.log(result3);
                cb( result3 );
                
            }
        }
        wait();

    }
    
    run(cb){
        this.get((res)=>{
            cb(res);
            setTimeout( this.run(cb), 1000);
        });
    }

    get_comments(sub,before,cb){
        var search = reddit.comments( "" , sub ).sort("new").limit(25);
        if(before != null){
            search.before( before );
        }
        search.fetch(
            (res)=>{
                var ret = [];
                if( res.data.children.length > 0){
                    var ret_before = res.data.children[0].data.name;
                } else {
                    var ret_before = before;
                }
                res.data.children.forEach((e)=>{
                    var md = e.data.body;
                    // var txt = this.normalize(md);
                    ret.unshift( [md, e.data.created_utc] );
                });
                cb( ret , ret_before );
                // console.log( ret );
            },
            ()=>{
                cb( [] , before )
            });
    
    }

    get_posts(sub,before,cb){
        var search = reddit["new"]( sub ).limit(25);
        if(before != null){
            search.before( before );
        }
        search.fetch(
            (res)=>{
                // console.log(res);
                var ret = [];
                if( res.data.children.length > 0){
                    var ret_before = res.data.children[0].data.name;
                } else {
                    var ret_before = before;
                }
                res.data.children.forEach((e)=>{
                    var txt = e.data.title;
                    ret.unshift( ["New Post: " + txt, e.data.created_utc] );
                });
                cb( ret , ret_before );
                // console.log( ret );
            },
            ()=>{
                cb( [] ,before )
            });
    }

}
