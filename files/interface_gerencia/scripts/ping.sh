while read ip
do
    ping -c 2 $ip > ping_output 2> ping_output_errors
    a=`cat ping_output|grep received|cut -d"," -f2|cut -d" " -f2`
    if [ $a -eq 0 ];
    then
    echo "$ip OFF"
    else
    echo "$ip ON"
    fi
    sleep 1
done < $1

rm ping_output
rm ping_output_errors
