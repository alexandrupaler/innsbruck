function processInputMatrix()
{
    var lines = document.getElementById("inputmatrix").value.split('\n');

    changeMaxi(lines.length);

    createBigMatrix();

    for(var li = 0; li < lines.length; li++)
    {
        var entries = lines[li].trim().split(" ");

        //consider only the upper diagonal
        for(var i = 0; i < entries.length; i++)
        {
            theBigMatrix[li][i] = entries[i];
            //if the edge does not exist in reversed direction
            if(theBigMatrix[i][li] == 0)
            {
                if (i != 0 && li != 0 && entries[i] > 0) {
                    cygraph.add({
                        group: "edges",
                        data: {source: li, target: i}
                    });
                }
            }
        }
    }

    drawEntireTriangle(cyrecon, runAnalysis());
}