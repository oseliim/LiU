while read ip
do
	echo $ip
	echo "route del default" > /dev/tcp/$ip/3535
#	sleep 30
done < $1
