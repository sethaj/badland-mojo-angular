#!/usr/bin/env perl
use Mojolicious::Lite;
use DBI;

my $dbname = "/home/serth/badland-mojo/badland.sqlite.2015-10-22.db";
our $dbh = DBI->connect("dbi:SQLite:dbname=$dbname","","", {
    PrintError       => 0,
    RaiseError       => 1,
    AutoCommit       => 1,
    FetchHashKeyName => 'NAME_lc', 
});

my $static = app->static();
push @{ $static->paths }, "/home/serth/badland.org/public/";

plugin 'Config';

plugin 'AssetPack';

my @js_files = (
    "https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.js",
    "https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.3.15/angular.js",
    "https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.3.15/angular-route.js",
    "https://cdnjs.cloudflare.com/ajax/libs/masonry/3.3.2/masonry.pkgd.min.js",
    "js/jquery.timers.js",
    "js/badland.js",
);

app->asset(
    'app.js' => @js_files
);

app->asset(
    'style.css' => (
        "css/badland.css",
    )  
);



get '/' => sub {
    my $self = shift;
    $self->cookie('XSRF-TOKEN' => $self->csrf_token, { path => '/' });
    $self->render('index');
};


get '/badland' => sub {
    my $self = shift;

    my $songs   = $dbh->selectall_arrayref("select * from song order by score desc") or die $dbh->errstr;
    my $asciis  = $dbh->selectall_arrayref("select * from ascii");
    my $count   = scalar @$asciis;
    my $badlands = [];

    for my $song (@$songs) {
         
        my $ogg = $song->[1];
        $ogg =~ s/\.mp3$/\.ogg/;

        push @$badlands, {
            id      => $song->[0],
            file    => $song->[1],
            ogg     => $ogg,
            song    => $song->[2],
            score   => $song->[3],
            ascii   => $asciis->[int(rand($count))]->[1], 
        }
    }

    $self->render(json => {
        badlands => $badlands
    }, status => 200);

};


post '/update/:song_id' => sub {

    my $self    = shift;
    my $song_id = $self->stash('song_id');
    my $csrf    = $self->req->headers->header('X-XSRF-TOKEN') || '';

    if ($csrf ne $self->csrf_token) {
        $self->app->log->warn($self->tx->remote_address . "failed to update " . $song_id ." : BAD TOKEN");
        $self->rendered(403);
    }

    my $sth = $dbh->prepare("update song set score = score + 1 where id = ?");
    $sth->execute($song_id);

    $sth = $dbh->prepare("select score from song where id = ?");
    $sth->execute($song_id);
    my $score = $sth->fetchrow;

    $self->app->log->info($self->tx->remote_address . " updated  " . $song_id);

    $self->render(json => { score => $score }, status => 200);

};


app->start;


__DATA__
@@ layouts/default.html.ep
<!doctype html>
<html>
    <head>
        <title><%= title %></title>
        <%= asset 'style.css' %>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="google-site-verification" content="nw0_4eHiUsEx8f3jkp00XTMuUuz5huvZZtU3rRynOBA" />
        <!-- Global site tag (gtag.js) - Google Analytics -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-T9X9XDSDGR"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-T9X9XDSDGR');
        </script>
    </head>
    <body ng-app="Badland">

        <div>
            <%= content %>
        </div>

        <%= asset 'app.js' %>
        <!-- Global site tag (gtag.js) - Google Analytics -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=UA-12175263-1"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'UA-12175263-1');
        </script>
    </body>
</html>


@@ index.html.ep
% layout 'default';
% title 'badland';
<ng-view></ng-view>

