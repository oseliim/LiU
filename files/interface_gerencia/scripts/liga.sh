l=0
while read -r mac
do
    ((l++))
    echo "Ligando máquina $l"
    wakeonlan "$mac"
    sleep 2
done < $1
