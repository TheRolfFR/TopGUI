document.addEventListener("DOMContentLoaded", function(event) {
    var script = document.createElement("script");
    script.src = "https://code.jquery.com/jquery-3.2.1.min.js";
    script.onload = script.onreadystatechange = function() {
        $(function() {
            $('a').on('click', function(e){
                e.preventDefault();

                if($(this).attr('target').toLowerCase() == '_blank') {
                    alert('blank');
                }
            });
        });
    };
    document.body.appendChild(script);
});