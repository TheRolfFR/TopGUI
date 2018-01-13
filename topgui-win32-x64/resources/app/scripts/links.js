document.addEventListener("DOMContentLoaded", function(event) {
    var script = document.createElement("script");
    script.src = "https://code.jquery.com/jquery-3.2.1.min.js";
    script.onload = script.onreadystatechange = function() {
        $(function() {
            $('a').on('click', function(e){
                // e.preventDefault();
                if($(this).attr('target').toLowerCase() == '_blank') {
                    var json = {
                        action: "blank",
                        url: $(this)[0].href
                    };
                    console.log('electron:' + JSON.stringify(json));
                }
            });
            var favicon = "";
            if($(document).find('link[rel="shortcut icon"]').length) {
                favicon = $(document).find('link[rel="shortcut icon"]')[0].attr('href');
            }
            var favicondata = {
                action: "faviconColor",
                url: document.location.href,
                href: favicon
            };
            console.log('electron:' + JSON.stringify(favicondata));
        });
    };
    document.body.appendChild(script);
});