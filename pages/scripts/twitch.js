function validTwitch(url) {
    var p = /(https?:\/\/)?(player\.)?(go\.)?twitch\.tv\/(.*)/;
    return (url.match(p)) ? RegExp.$4 : false;
}
function player(name, chatchecked) {
    if(chatchecked) {
        $('#theiframe').html('<iframe frameborder="0" scrolling="yes" id="' + name + '" src="http://www.twitch.tv/' + name + '/chat" height="100%" width="100%"></iframe>');
    } else {
        new Twitch.Embed("theiframe", {
            channel: name,
            height: '100%',
            width: '100%',
            'font-size': 'small',
            layout: 'video'
        });
    }
}

$(document).ready(function(){
    $('form').on('submit', function(e){
        e.preventDefault();

        var url = $(this).find('#url').val();
        var name = validTwitch(url);
        if(name) {
            var chatchecked = $('#chatonly').is(':checked');
            $('body').addClass('ohidden');
            $('#close, #theiframe').removeClass('none');
            player(name, chatchecked);
        }
    });
    $('#close i').on('click', function(){
        $('form')[0].reset();
        $('body').removeClass('ohidden');
        $('#theiframe').html('');
        $('#close, #theiframe').addClass('none');
    });
});