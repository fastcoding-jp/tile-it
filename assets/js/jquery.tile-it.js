$.fn.tileIt = function(settings){
    
    var app = this;
    app.$sliders = $(this);
    
    app.settings = $.extend({
        sliceW: 5,
        sliceH: 4,
        speed: 1000,
        auto: true,
        pause: 5000,
        autoHide: true,
        onLoad: function(){}
    }, settings);
    
    app.init = function($slider) {
        $slider.append('<div class="ti-wrapper"></div>');
        app.load_images($slider);
    }
    
    app.load_images = function($slider) {
        var $img = $slider.find("img");
        var nb_loaded = 0;
        $img.each(function(){
            var image = new Image();
            image.src = $(this).attr("src");
            image.$dom = $img;
            image.onload = function(){
                this.$dom.attr("width", this.width);
                this.$dom.attr("height", this.height);
                nb_loaded++;
                if(nb_loaded==$img.length) app.run($slider);
            }
        });
    }
    
    app.run = function($slider) {
        app.set_slides($slider);
        app.set_controls($slider);
        app.events($slider);
        if(app.settings.auto) app.start_loop($slider);
        app.settings.onLoad($slider[0]);
    }
    
    app.set_controls = function($slider) {
        $slider.find(".ti-wrapper").append('<div class="ti-control ti-prev">Prev</div>');
        $slider.find(".ti-wrapper").append('<div class="ti-control ti-next">Next</div>');
    }
    
    app.set_slides = function($slider) {

        $slider.find(".ti-wrapper").append('<div class="ti-slides"></div>');
        var imgs = $slider.find("img").get().reverse();
        var slide_id = imgs.length-1;
        var tileW_per = (100/app.settings.sliceW).toFixed(2);
        var tileH_per = (100/app.settings.sliceH).toFixed(2);
        $(imgs).each(function(index){
            var $img = $(this);
            $img.attr("slide-id", slide_id);
            var bg_tile = app.get_bg_tile($slider, $img[0]);
            var tileW = Math.ceil($slider.width()/app.settings.sliceW);
            var tileH = Math.ceil($slider.height()/app.settings.sliceH);
            var $slide = '<div class="ti-slide" slide-id="'+slide_id+'">';
            for(var j=0; j<app.settings.sliceH; j++){
                for(var i=0; i<app.settings.sliceW; i++){
                    var posX = -bg_tile.offset.x-(i*tileW);
                    var posY = -bg_tile.offset.y-(j*tileH);
                    var rand = (Math.random() * ((app.settings.speed/1000).toFixed(2)-.3)).toFixed(1);
                    $slide += '<div class="ti-tile" tile="'+j+'-'+i+'" style="width: '+tileW_per+'%; height: '+tileH_per+'%; background-image: url('+$img.attr("src")+'); background-position: '+posX+'px '+posY+'px; background-size: '+bg_tile.w+'px '+bg_tile.h+'px; -webkit-transition-delay: '+rand+'s; -moz-transition-delay: '+rand+'s; -ms-transition-delay: '+rand+'s; transition-delay: '+rand+'s;"></div>';
                }
            }
            $slide += '</div>';
            $slider.find(".ti-slides").append($slide);
            slide_id--;
        });
        
        $slider.find(".ti-slide:last-child").addClass("active");
        
    }
    
    app.refresh = function($slider) {

        $slider.find(".ti-slide").each(function(){
            var slide_id = $(this).attr("slide-id");
            var $img = $slider.find("img[slide-id='"+slide_id+"']");
            var bg_tile = app.get_bg_tile($slider, $img[0]);
            var prev_size = $(this).find(".ti-tile").css("background-size");
            var new_size = bg_tile.w+"px "+bg_tile.h+"px";
            if(prev_size!=new_size) $(this).find(".ti-tile").css("background-size", new_size);
            $(this).find(".ti-tile").each(function(){
                var coors = $(this).attr("tile").split("-");
                var i = parseInt(coors[1]);
                var j = parseInt(coors[0]);
                var tileW = Math.ceil($slider.width()/app.settings.sliceW);
                var tileH = Math.ceil($slider.height()/app.settings.sliceH);
                var posX = -bg_tile.offset.x-(i*tileW);
                var posY = -bg_tile.offset.y-(j*tileH);
                var prev_pos = $(this).css("background-position");
                var new_pos = posX+"px "+posY+"px";
                if(prev_pos!=new_pos) $(this).css("background-position", new_pos);
            });
        })
    }
    
    app.get_bg_tile = function($slider, img) {
    
        var bg_tile = {
            w: $slider.width(), 
            h: $slider.height(),
            offset:{x:0,y:0}
        }
        
        var ratio_img = img.width/img.height;
        var ratio_slider = $slider.width()/$slider.height();
        
        if(ratio_slider>ratio_img){
            bg_tile.h = Math.ceil((img.height*$slider.width())/img.width);
            bg_tile.offset.y = Math.ceil((bg_tile.h/2)-($slider.height()/2));
        }
        else{
            bg_tile.w = Math.ceil((img.width*$slider.height())/img.height);
            bg_tile.offset.x = Math.ceil((bg_tile.w/2)-($slider.width()/2));
        }
        
        return bg_tile;
    }
    
    app.move = function($slider, inc, manual) {
    
        var $current = $slider.find(".ti-slides .ti-slide.active");
        var curr_id = parseInt($current.attr("slide-id"));
        var nb_slides = $slider.find(".ti-slides .ti-slide").length;
        var next_id = (curr_id+inc) % nb_slides;
        if(next_id<0) next_id = nb_slides+next_id;
        var $next = $slider.find("[slide-id="+next_id+"]");
        $current.before($next);

        $current.addClass("animating");
        setTimeout(function(){
            $current.removeClass("active");
            $current.prependTo($slider.find(".ti-slides"));
            $current.removeClass("animating");
            $next.addClass("active");
            if(manual && app.settings.auto) app.start_loop($slider);
        }, app.settings.speed);
    
    }
    
    app.events = function($slider){
        
        if(app.settings.autoHide){
            $slider.find(".ti-control").hide();
            $slider.hover(function(){
                $(this).find(".ti-control").fadeIn();
            }, function(){
                $(this).find(".ti-control").fadeOut();
            });
        }
        
        $slider.find(".ti-next").click(function(){
            app.stop_loop($slider);
            app.move($slider, 1, true);
        });
        
        $slider.find(".ti-prev").click(function(){
            app.stop_loop($slider);
            app.move($slider, -1, true);
        });
        
        $(window).resize(function(){
            app.refresh($slider);
        });
        
    }
    
    app.start_loop = function($slider){
        $slider[0].loop = setInterval(function(){
            app.move($slider, 1);
        }, app.settings.pause)
    }
    
    app.stop_loop = function($slider){
        clearInterval($slider[0].loop);
    }

    return app.$sliders.each(function(){
        
        var $slider = $(this);
        
        this.stop = function(){
            app.stop_loop($slider);
        }
        
        this.start = function(){
            app.start_loop($slider);
        }
        
        app.init($slider);
    });
    
}