function Generator(brojOperanada, operatori) {
    this.BrojOperanada = brojOperanada; // Broj brojeva s kojima računamo
this.Operatori = operatori; // Mogući operatori
this.IzrazArray = []; // Zapis izraza kao polje ['operand1', 'operator1', 'operand2', 'operator2', ..., 'opeatorN-1', 'operandN']
this.Rezultat = ''; // Zapis točnog rezultata
this.DozvoliNegativneRezultate = false; // Dozvoljavamo li negativne rezultate
this.Min = 1; // Najmanji pojedinačni broj
this.Max = 10; // Najveći pojedinačni broj
this.MaxRezultat = 100; // Najveći mogući rezultat
this.PreciznostOdgovora = 1; // Na koliko znamenki odgovor mora biti točan
this.DozvoljeniOperatori = ['+', '-', '*', '/']; // Lista dozvoljenih operatora
if (typeof this.Operatori == 'undefined') this.Operatori = this.DozvoljeniOperatori; // Postavi defaultne operatore na dozvoljene ukoliko nisu eksplicitno navedeni operatori u parametru

this.Popuni(); // Konstruktor popuni izraz i rezultat
}

Generator.prototype.Random = function(min, max) {
// Math.random() vraća broj između 0 (uključujući) i 1 (isključujući)
return Math.floor(Math.random() * (max - min) + min);
};

Generator.prototype.Popuni = function() {
    this.IzrazArray = []; // Isprazni izraz
this.Rezultat = ''; // Isprazni rezultat

// Generiraj sve operande (osim zadnjega) i operacije između njih
for (var i = 0; i < this.BrojOperanada - 1; i++)
{
/* Postoji mogućnost da Math.random() vrati gornju granicu (koja bi trebala biti isključena).
   Vjerojatnost je 1/2^62, ali postoji mogućnost pa se gradimo od toga */
    var broj = this.Random(this.Min, this.Max + 1);
    if (broj == this.Max + 1) broj = this.Max;
    this.IzrazArray.push(broj); // Ubacimo generirani operand

var indexOpeartora;
do
{
    /* Ista priča sa .random() kao i gore, treba provjeriti da nije nasumično generirana gornja granica jer smo onda out of bounds */
    indexOpeartora = this.Random(0, this.Operatori.length);
    if (indexOpeartora == this.Operatori.length) indexOpeartora = this.Operatori.length - 1;
    if ($.inArray(this.Operatori[indexOpeartora], this.DozvoljeniOperatori) > -1) break; // Provjera je li operator u listi dozvoljenih
}
while (true);
this.IzrazArray.push(this.Operatori[indexOpeartora]); // Ubacimo generirani operator
}

// Dodaj još zadnji operand
   var broj = this.Random(this.Min, this.Max + 1);
if (broj == this.Max + 1) broj = this.Max;
this.IzrazArray.push(broj);

// Izračunaj rješenje na temelju izraza
   this.Rezultat = eval(this.IzrazArray.join(' '));

// Provjeri je li rezultat veći od nule, ovisno o odabiru
if (this.Rezultat < 0 && !this.DozvoliNegativneRezultate) this.Popuni();

// Provjeri je li rezultat unutar zadane granice
   if (this.Rezultat > this.MaxRezultat) this.Popuni();
};

Generator.prototype.ProvjeraRezultata = function(unesenRezultat) {
/* Kod provjere rezultata zaokružujemo rezultat na temelju željene preciznosti
   npr. 1/3
        preciznost 1: 0.3 se prihvaća, 0.33 se prihvaća, 0.333 se prihvaća
        preciznost 2: 0.3 se ne prihvaća, 0.33 se prihvaća, 0.333 se prihvaća
        preciznost 3: 0.3 se ne prihvaća, 0.33 se ne prihvaća, 0.333 se prihvaća
   Zaokružuje se tako da se uz preciznost 1 za npr. 8.857142857142858 priznaje 8.9, dok se 8.8 ne priznaje */
    var zaokruzeniUnos = unesenRezultat.toFixed(this.PreciznostOdgovora);
    var zaokruzeniRezultat = this.Rezultat.toFixed(this.PreciznostOdgovora);
    return (zaokruzeniRezultat == zaokruzeniUnos);
};

var generatorInstance = null;

exports.create = function(numbersCount, operators)
{
    generatorInstance = new Generator(numbersCount, operators);
}

exports.getTask = function()
{
    if (generatorInstance != null)
        return generatorInstance.IzrazArray;
    else return null;
}

exports.getResult = function()
{
    if (generatorInstance != null)
        return generatorInstance.Rezultat;
    else return null;
}