while read ip
do
	echo $ip
	echo d > /dev/tcp/$ip/3535
done < $1
