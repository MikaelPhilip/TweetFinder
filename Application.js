/*
Auteur: PHILIP Mikaël
Script du site web Tweet finder
*/

var req; //Requete qui nous permettra de rechercher les tweets
var nextResult="-"; //Stockera, aprés chaque execution d'une requete de recherche, les paramétres qui permettent d'acceder aux résultats suivant de la recherche

var map; //Représente notre carte
var markers; //Listes des marqueurs de notre carte
var icon; //L'icone utilisée pour chaque marqueur
var popup; //Le pop-up que l'on verra sur la map sur chaque clic sur un marqueur
var sundialsLayer; //layer du pop-up

//Fonction d'initialisation de la map
function init(){

    //Création de la map
	map = new OpenLayers.Map('map');
	map.addLayer(new OpenLayers.Layer.OSM("map"));
    
    //On crée le layer pour l'affichage des marqueurs
    markers = new OpenLayers.Layer.Markers("Markers");
    map.addLayer(markers);
    map.zoomToMaxExtent();

    //On crée l'icone du marqueur
    var size = new OpenLayers.Size(26,31);
    var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
    icon = new OpenLayers.Icon('http://www.openlayers.org/dev/img/marker.png', size, offset);
    
}

//Fonction appellee lors du lancement d'une nouvelle recherche
function newRecherche(){
    nextResult="-"; //Il s'agit d'une nouvelle recherche alors on réinitialise la variable next_result
    recherche();
}

//Fonction qui nous permet de lancer une requete de recherche, appellée lors d'une nouvelle recherche où lorsque que l'on veut les résultats suivants
function recherche(){

    //Appel d'une fonction pour remettre l'affichage dans son état initial
    reinit();
    
	//Variable qui va contenir toute notre url, on lui indique qu'on utilise notre script php
	var url = "geotweet.php?twitter_query=";
    //Début de l'url que va utiliser notre script php
    var link = "https://api.twitter.com/1.1/search/tweets.json?q=";
	//On récupere le hashtag rentré dans le champ que l'on encode
	var hashtagEnc = encodeURIComponent(document.getElementById("hashtag").value);
    //On determine un autre parametre: le nombre de résultat que l'on veut par requete
    var count = "&count=30"; 
    //On vérifie si on a stocké les paramêtres pour avoir le résultat suivant 
    if(typeof(nextResult)!='undefined' && nextResult !== "-"){ 
        //On va récuperer un seul parametre ('max-id') dans nextResult
        //On va le rajouter à la suite des autres paramêtres 
        nextResult= nextResult.slice(1); //Donc on supprime le premier caractére du nextResult '?' qui symbolise dans l'url le début de la liste des paramêtres
        var nextResultDecomp = nextResult.split("&"); //On sépare chaque paramêtre
        //Et on rajoute que le premier parametre trouvé à la suite des autres élements de notre lien
        var paramEnc = encodeURIComponent(link+hashtagEnc+count+'&'+nextResultDecomp[0]);
    }else{
        //On encode et regroupe tout les élements de notre lien
        var paramEnc = encodeURIComponent(link+hashtagEnc+count);
    }
    //On rajoute à l'url le liens et les paramêtres nécessaires à une recherche
	url = url + paramEnc ;
   
	//Création de la requete
    	if (window.XMLHttpRequest)
    	{ // Mozilla, Safari, IE7 ...
        	req = new XMLHttpRequest();
    	}
    	else if (window.ActiveXObject)
    	{ // Internet Explorer 6
        	req = new ActiveXObject("Microsoft.XMLHTTP");
    	}
	//On doit récupérer pendant l'execution de la requete des données on appelle donc la fonction ecoute() lors de chaque changement d'état
	req.onreadystatechange = ecoute;
    //On envoie la requete	
    req.open("GET", url, true);
    req.send(); 
}

//Fonction qui va permettre de créer la liste des tweets
function ecoute(){
	if (req.readyState == 4 && req.status == 200)
    {
        //On va récupérer les données dans une variable JSON
        var jason = JSON.parse(req.responseText);
        console.log(req.responseText);
        console.log(jason);
        //Pour chaque résultat de recherche
        for(var i=0;i<jason.search_metadata.count;i++){
            if(typeof(jason.statuses[i]) !='undefined'){
                //Si on a trouvé le premier tweet et que c'est le premier ajout (vérifié par la function premier()) dans la liste
                if(premier() && i==0){
                //On va remplacer le premier <li> qui contenait un message d'erreur dans le cas d'absence de tweets trouvés
                    document.getElementById("tweets").innerHTML="<li>"
                                                    +"<img id='profile' src='"+jason.statuses[i].user.profile_image_url+"'>"
                                                    +"<h3 id='auteur'><b>"+jason.statuses[i].user.name+"</b></h3>"
                                                    +"<p id='contenu'>"+jason.statuses[i].text+"</p>"
                                                    +"</li>";
                }else{
                //Sinon on en rajoute une ligne à la suite de notre liste
                    document.getElementById("tweets").innerHTML+="<li>"
                                                    +"<img id='profile' src='"+jason.statuses[i].user.profile_image_url+"'>"
                                                    +"<h3 id='auteur'><b>"+jason.statuses[i].user.name+"</b></h3>"
                                                    +"<p id='contenu'>"+jason.statuses[i].text+"</p>"
                                                    +"</li>";
                }
                
                //Si le tweet retrouvé posséde des coordonnées
                if(jason.statuses[i].coordinates != null){
                //Alors on apppelle la méthode de gestion des markers
                marqueurs(jason, i);
                }
            }
        }
        //A la fin de la requete on récupére la propriéte next_result pour obtenir les parametres qui serviront à obtenir les résultats suivants
        nextResult= jason.search_metadata.next_results;
    }
}

//Fonction qui réinitialise la page à chaque nouvelle requete de recherche
function reinit(){
   //On détruit tout les markers sur la carte
   markers.clearMarkers();
   
   //On recherche toutes les pop-ups
   while( map.popups.length ) {
     //On supprime chaque pop-up
     map.removePopup(popup);
   }
   //On réinitilaise toute la liste des tweets
   document.getElementById("listeTweets").innerHTML="<h2>"+"Tweets retrouvés"+"</h2>"
                                            +"<ul id='tweets'>"
                                            +"<li>"
                                            +"<img id='profile' src='img/question.jpg'>"
                                            +"<h3 id='auteur'><b>Pas de tweets trouvé:</b></h3>"
                                            +"<p id='contenu'>Veuillez effectuer une recherche ou changer le hashtag que vous avez indiqué dans votre recherche</p>"
                                            +"</li>"
                                            +"</ul>"
                                            +"<input class='boutons' id='btnNext' type='submit' value='Resultats suivants' onclick='recherche()'>";
}

//Fonction permettant de vérifier si on a déja fait un ajout de tweet
function premier(){
    //On récupére la liste des tweets
    var tweets = document.getElementById("tweets");
    //On récupére les élements de la liste
    var liTweets = tweets.getElementsByTagName("li");
    //On calcule le nombre de ligne
    var nbtweets = liTweets.length;
    //Si on n'a qu'une seule ligne ce ne peut etre que la ligne par défault (pas de tweets trouvés): on n'a donc pas eu d'ajout
    if(nbtweets == 1){
        return true;
    }
        return false;
}

//Méthode pour génerer un marqueur et rajouter un listener pour ouvrir une pop-up à chaque click
function marqueurs(js,i){

    var jason= js;
    
    //Création et transformation des coordonnées
    var projCarte = map.getProjectionObject();
    var projSpherique = new OpenLayers.Projection("EPSG:4326"); 
    var coord = new OpenLayers.LonLat(jason.statuses[i].coordinates.coordinates[0],jason.statuses[i].coordinates.coordinates[1]); //Coordonnées en longitude/latitude
    coord.transform(projSpherique,projCarte); //Transformation des coordonnées
    
    //Création d'un nouveau marqueur:On clone l'icone utilisé pour éviter de déplacer le marqueur d'avant
    var cpIcon = icon.clone();
    var marker = new OpenLayers.Marker(coord,cpIcon);
    markers.addMarker(marker);
    //Pour la description des bulles-infos des marqueurs:
    auteur = jason.statuses[i].user.name;
    texte = jason.statuses[i].text;
    
    //Pb: le listener aprés l'execution de la boucle réutilise que les derniéres données du dernier tweet pour l'auteur et le texte
    //et dans toutes les variables de l'event (evt) rien ne permet de savoir à quel id, tweet trouvé correspond le marker: on n'a pas de "lien"
    marker.events.register('mousedown', marker, function(evt) { 
        console.log(evt);
        //Si une pop-up est déja ouverte
        if (typeof(popup) !='undefined'){ 
            //Alors on le ferme
            map.removePopup(popup);
        }
        
        //Création d'une pop-up
        var feature = new OpenLayers.Feature(null, evt.object.lonlat); //evt.object.lonlat représente les coordonnées du marqueur visé
        popup = feature.createPopup(true);
        popup.setContentHTML("<div id='pop-up'><p><b>"+auteur+"</b><p>"+"<p>"+texte+"</p></div>");
        popup.setBackgroundColor("DeepSkyBlue");
        popup.size = new OpenLayers.Size(200,200);
        popup.setOpacity(0.7);
        markers.map.addPopup(popup);
    });  
}


