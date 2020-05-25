#!/usr/bin/env sh

echo 'fixing trailing whitespace'
perl -pi -e 's#\s+$#\n#g' $@

echo 'fixing void style (incorrectly self-closed empty tags)'
perl -0777pi -e 's#(<(area|base|basefont|br|col|frame|hr|img|input|isindex|link|meta|param|embed|track|command|source|keygen|wbr)( [^>]*?)?)/>#\1>#gsm' $@

echo 'fixing tag pairs (incorrectly self-closed non-empty tags)'
perl -0777pi -e 's#(<(?!(area|base|basefont|br|col|frame|hr|img|input|isindex|link|meta|param|embed|track|command|source|keygen|wbr))( [^>]*?)?)/>#\1></\2>#gsm' $@

echo 'fixing missing href'
perl -pi -e 's# href(="")? # #g' $@
