while :
do
	nc -l 3535 > b
	a=`cat b`
	$a &
done
