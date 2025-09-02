while read ip
do
	echo $ip
	echo $1 > /dev/tcp/$ip/3535
#	sleep 30
done < $2


