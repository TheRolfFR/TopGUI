function validYT(url) {
    var p = /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?=.*v=((\w|-){11}))(?:\S+)?$/;
    return (url.match(p)) ? RegExp.$1 : false;
}

$(document).ready(function(){
    $('form').on('submit', function(e){
        e.preventDefault();

        var url = $(this).find('#url').val();
        if(validYT(url)) {
            var id = validYT(url);
            
            $('body').addClass('ohidden');
            $('#close').removeClass('none');
            $('iframe').removeClass('none').attr('src', 'https://www.youtube.com/embed/' + id + '?autoplay=1&modestbranding=1');
        }
    });
    $('#close i').on('click', function(){
        $('form')[0].reset();
        $('body').removeClass('ohidden');
        $('iframe').attr('src','');
        $('#close, iframe').addClass('none');
    });
});