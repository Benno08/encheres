//////////////////
// Variables
//////////////////

var partieId = 0;
var joueurId = 0;
var evtSource;

//////////////////
// Au chargement de la page
//////////////////
$(document).ready(function()
{
    partieId = $('#encheres').data('id');
    joueurId = $('#joueur').data('id');
    evtSource = new EventSource("update/" + partieId);

    evtSource.addEventListener('lot', lotHandler, false);
    evtSource.addEventListener('enchere', enchereHandler, false);
    evtSource.addEventListener('finenchere', finenchereHandler, false);
    evtSource.addEventListener('finmanche', finmancheHandler, false);
    evtSource.addEventListener('finpartie', finmancheHandler, false);

    $('#submitEnchere').click(submitEnchere);
    $('#submitEnchere').submit(function(e) {
        submitEnchere();
        e.preventDefault();
        return false;
    });
});

var lotHandler = function(e) {
    var data = JSON.parse(e.data);

    $('#lotId').val(data.id);
    $('#numeroLot').html(data.numero);
    $('#lot #titre').html(data.name);
    $('#lot #description').html(data.description);
    $('#lot #enchereMinimale').html(data.startingStake);
    $('#lot #valeurRevente').html(data.resellPrice);
    $('#lot #imageLot').attr('src', data.image);
    $('#lot #imageLot').removeClass('hidden');
    $('#montant').prop('disabled', false);
    $('#montant').val(data.startingStakeNumber);
    $('#submitEnchere').removeClass('disabled');
    $('#remainingTime').removeClass('orange').removeClass('red');
    $('#meilleureOffreName').html("En attente");
    $('#meilleureOffreImage').addClass('hidden').attr('src', '');
    $('#meilleureOffre .status').removeClass('red').removeClass('green').addClass('orange');
    $('#monOffreContainer').removeClass('invisible');
    $('#enchereContainer').removeClass('hidden');
    $('#resultats').addClass('hidden');
};

var enchereHandler = function(e) {
    var data = JSON.parse(e.data);

    if(data.encherisseurId != 0)
    {
        $('#meilleureOffreName').html(data.encherisseurName);
        $('#meilleureOffreImage').attr('src', data.encherisseurImage).removeClass('hidden');
        var status = (data.encherisseurId == joueurId) ? 'green' : 'red';
        $('#meilleureOffre .status').removeClass('orange').removeClass('red').removeClass('green');
        $('#meilleureOffre .status').addClass(status);
        if(data.encherisseurId != joueurId)
        {
            $('#montant').prop('disabled', false);
            $('#submitEnchere').removeClass('disabled');
        }
    }

    // MAJ Temps restant
    $('#remainingTime').css('width', (parseFloat(data.tempsRestant) / 60) * 100 + '%');
    if(data.tempsRestant == 15)
        $('#remainingTime').addClass('orange');
    else if(data.tempsRestant == 5)
        $('#remainingTime').removeClass('orange').addClass('red');
};

var finenchereHandler = function(e) {
    var data = JSON.parse(e.data);

    if(data.encherisseurId != 0)
    {
        $('#meilleureOffreName').html(data.encherisseurName);
        $('#meilleureOffreImage').attr('src', data.encherisseurImage);
        var status = (data.encherisseurId == joueurId) ? 'green' : 'red';
        $('#meilleureOffre .status').removeClass('orange').removeClass('red').removeClass('green');
        $('#meilleureOffre .status').addClass(status);
    }

    // MAJ Temps restant
    $('#remainingTime').css('width', 0);
    $('#monOffreContainer').addClass('invisible');

    // MAJ Capital joueur
    updateCapitalJoueur();
};

var finmancheHandler = function(e) {
    var data = JSON.parse(e.data);

    $.ajax({
        async: true,
        cache: false,
        method: 'post',
        url: 'resultats',
        data: {'mancheId': data.mancheId},
        timeout: 3000
    }).done(function(data)
    {
        $('#enchereContainer').addClass('hidden');
        $('#resultats').html(data).removeClass('hidden');

        // MAJ Capital joueur
        updateCapitalJoueur();
    });
};

var finpartieHandler = function() {
    evtSource.close();
};

var submitEnchere = function()
{
    if(!$(this).hasClass('disabled'))
    {
        $.ajax({
            async: true,
            cache: false,
            dataType: 'json',
            method: 'post',
            url: 'encherir',
            data: $(this).parents('form').first().serialize(),
            timeout: 1000
        }).fail(function()
        {

        }).done(function(data)
        {
            $('#enchereStatusMessage').addClass(data.status).html(data.message).toggleClass('notvisible');

            setTimeout(function(){
                $('#enchereStatusMessage').toggleClass('notvisible').removeClass(data.status);
            }, 2000);

            if(data.status == 'OK')
            {
                $('#montant').prop('disabled', true);
                $('#submitEnchere').addClass('disabled');
            }
        });
    }
};

function updateCapitalJoueur() {
    $.ajax({
        async: true,
        cache: false,
        dataType: 'json',
        method: 'post',
        url: 'capitaljoueur',
        data: {'joueurId': joueurId},
        timeout: 1000
    }).fail(function()
    {

    }).done(function(data)
    {
        if(data.status == 'OK')
        {
            $('#capital').html(data.capital).animate({scale: 1.2}, 250, function() {
                $('#capital').animate({scale: 1.0}, 50);
            });
        }
    });
}