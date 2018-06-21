var theBigMatrix = new Array();

/*
 Utils
 */

function createBigMatrix()
{
    theBigMatrix = new Array(maxi);
    for (var i = 0; i < maxi; i++)
    {
        theBigMatrix[i] = new Array(maxi);
        for (var j = 0; j < maxi; j++)
        {
            theBigMatrix[i][j] = 0;
        }
    }
}

function writeBigMatrix()
{
    var string = "";
    for (var i = 0; i < maxi; i++)
    {
        for (var j = 0; j < maxi; j++)
        {
            var val = theBigMatrix[i][j];
            if(val < 10)
                val = " " + val;//add empty space for digits %2d
            string += val + " ";
        }
        string += "\n";
    }


    document.getElementById('matrix').appendChild(document.createTextNode(string));
}