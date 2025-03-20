let menuVisible = false;
//Función que oculta o muestra el menu
function mostrarOcultarMenu(){
    if(menuVisible){
        document.getElementById("nav").classList ="";
        menuVisible = false;
    }else{
        document.getElementById("nav").classList ="responsive";
        menuVisible = true;
    }
}

function seleccionar(){
    //oculto el menu una vez que selecciono una opcion
    document.getElementById("nav").classList = "";
    menuVisible = false;
}
//Funcion que aplica las animaciones de las habilidades
function efectoHabilidades(){
    var skills = document.getElementById("skills");
    var distancia_skills = window.innerHeight - skills.getBoundingClientRect().top;
    if(distancia_skills >= 300){
        let habilidades = document.getElementsByClassName("progreso");
        habilidades[0].classList.add("java");
        habilidades[1].classList.add("diseño");
        habilidades[2].classList.add("ofimatica");
        habilidades[3].classList.add("redes");
        habilidades[4].classList.add("ws");
        habilidades[5].classList.add("so");

        habilidades[6].classList.add("comunicacion");
        habilidades[7].classList.add("trabajo");
        habilidades[8].classList.add("atencion");
        habilidades[9].classList.add("resolucion");
        habilidades[10].classList.add("autodidacta");

        habilidades[11].classList.add("vms");
        habilidades[12].classList.add("video");
        habilidades[13].classList.add("fisica");
    }
}


//detecto el scrolling para aplicar la animacion de la barra de habilidades
window.onscroll = function(){
    efectoHabilidades();
} 

//

document.addEventListener("DOMContentLoaded", () => {
    // Elementos de la barra de carga
    const loadingText = document.querySelector('.loading-text');
    const progress = document.querySelector('.progress');
    const barraCarga = document.querySelector('.barra');
    const contenido = document.querySelector('.contenido');

    let dots = '', progressWidth = 0;

    // Animación del texto "Cargando..."
    const textInterval = setInterval(() => {
        loadingText.textContent = 'Cargando' + (dots = dots.length < 3 ? dots + '.' : '');
    }, 500);

    // Animación de la barra de progreso
    const progressInterval = setInterval(() => {
        progress.style.width = (progressWidth += 2) + '%';

        if (progressWidth >= 100) {
            clearInterval(textInterval);
            clearInterval(progressInterval);
            loadingText.textContent = '¡Carga completada!';

            setTimeout(() => {
                barraCarga.style.display = 'none'; // Oculta la barra de carga
                contenido.style.display = 'block'; // Muestra el contenido principal
            }, 500);
        }
    }, 100);
});

// DETECCIÓN DEL SCROLL PARA MODIFICAR EL HEADER
window.addEventListener("scroll", () => {
    let header = document.querySelector(".contenedor-header");
    if (window.scrollY > 50) {
        header.classList.add("abajo");
    } else {
        header.classList.remove("abajo");
    }
});



  
                                

