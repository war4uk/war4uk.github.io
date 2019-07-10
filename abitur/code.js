
parser();

async function parser() {
    var almazovEntries = await fetch("./almazov.txt").then(res => res.text())
        .then(text => text.split("\r\n").map(parseAlmazovEntry).map(entry => ({...entry, appliedToAlmazov: true})));
    var firstMedLechebnoeEntries = await fetch("./1med.lechebnoe.txt")
        .then(res => res.text()).then(text => text.split("\r\n").map(parse1medEntry).map(entry => ({...entry, appliedTo1medLechebnoe: true})));

    var firstMedSportivnoeEntries = await fetch("./1med.sportivnoe.txt")
        .then(res => res.text()).then(text => text.split("\r\n").map(parse1medEntry).map(entry => ({...entry, appliedTo1medSportivnoe: true})));

    var spbuLechebnoe = await fetch("./spbu.lechebnoe.txt").then(res => res.text())
        .then(text => text.split("\r\n").map(parseSpbuMedEntry).map(entry => ({...entry, appliedTospbuMed: true})));

    var spbuBio = await fetch("./spbu.bio.txt").then(res => res.text())
        .then(text => text.split("\r\n").map(parseSpbuBioEntry).map(entry => ({...entry, appliedToSpbuBio: true})));        

    var models = {};

    almazovEntries
        .concat(firstMedLechebnoeEntries)
        .concat(firstMedSportivnoeEntries)
        .concat(spbuLechebnoe)       
        .concat(spbuBio)                 
        .filter(entry => !!entry)
        .forEach(entry => {
           var model = models[entry.name] || {};
           models[entry.name] = {...model, ...entry};
        });

    var participantArray = Object.values(models).filter(entry => !!entry.name);
    participantArray.sort((entryA, entryB) => {return (+entryB.result) - (+entryA.result);})
        
    var app4 = new Vue({
        el: '#app-4',
        data: {
            ALmazovEntries: participantArray.filter(entry => entry.appliedToAlmazov), 
            firstMedLechebnoe: participantArray.filter(entry => entry.appliedTo1medLechebnoe),
            firstMedSportivnoe: participantArray.filter(entry => entry.appliedTo1medSportivnoe),
            spbuMed: participantArray.filter(entry => entry.appliedTospbuMed), 
            spbuBio: participantArray.filter(entry => entry.appliedToSpbuBio),                          
        }
      })



}


function parseSpbuMedEntry(text) {
    var cells = text.split("	").map(cell => cell.trim());
    if (cells[4] != "общ.") {
        return {};
    }
    return {
        name: cells[2],
        result: (cells[6] || "").split(",")[0],
        spbuMedOriginal: cells[12] == "Да",
        spbuMedNumber: cells[0]
    }
}

function parseSpbuBioEntry(text) {
    var cells = text.split("	").map(cell => cell.trim());

    if (cells[4] != "общ.") {
        return {};
    }
    return {
        name: cells[2],
        result: (cells[6] || "").split(",")[0],
        spbuBioOriginal: cells[12] == "Да",
        spbuBioNumber: cells[0]
    }
}

function parse1medEntry(text) {
    var cells = text.split("	").map(cell => cell.trim());

    var entry = {
        name: cells[1],
        result: cells[4],
    }

    return entry;
}

function parseAlmazovEntry(text) {
    var cells = text.split(" ").map(cell => cell.trim());

    if (cells[1] == "Таминдаров") {
        return;
    }

    var entry = {
        name: cells[1] + " " + cells[2] + " " + cells[3],
        result: cells[6],
        almazovOriginal: cells[11] == "Оригинал",
        almazovAgreed: !!cells[13]
    }

    return entry;
}