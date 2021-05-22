document.addEventListener("DOMContentLoaded", function () {
    require(['lib/sectional-js/sectional'], function (module) {
        var Sectional = module.Sectional;
        console.log(Sectional);

        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            var json = JSON.parse(xhr.responseText);
            var list = document.querySelector("#articles");
            var view = document.querySelector("#viewport");
            var sectional = new Sectional(view, json, {
                insertSections: true,
                entry: "0000000000000000000000"
            });

            var articles = sectional.getArticles();
            articles.forEach(function (articleId) {
                var div = document.createElement("div");
                div.style.setProperty("font-family", "consolas");
                div.style.setProperty("cursor", "pointer");
                div.innerHTML = articleId;
                div.addEventListener("click", function (e) {
                    sectional.clearViewport();
                    sectional.article(e.target.innerHTML);
                    Array.from(document.querySelector("#articles").children).forEach(function (child) {
                        child.classList.remove("selected");
                    });
                    e.target.classList.add("selected");
                });
                list.appendChild(div);
            });

            list.firstChild.click();
        }
        xhr.open("GET", "data.json", true);
        xhr.send();
    });
});
