#!/usr/bin/env perl
use Mojolicious::Lite;
use DBI;

my $dbname = $ENV{BADLAND_DB}
    || (-f "/home/serth/badland-mojo/badland.sqlite.2015-10-22.db"
        ? "/home/serth/badland-mojo/badland.sqlite.2015-10-22.db"
        : "database/badland.sqlite.2015-10-22.db");

my $dbh = DBI->connect("dbi:SQLite:dbname=$dbname","","", {
    PrintError       => 0,
    RaiseError       => 1,
    AutoCommit       => 1,
    FetchHashKeyName => 'NAME_lc',
});

push @{app->static->paths}, "/home/serth/badland.org/public/";

helper dbh => sub { $dbh };

plugin 'Config';
plugin 'AssetPack';
push @{app->asset->store->paths}, @{app->static->paths};
app->asset->process(
    'app.js' =>
        "https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.js",
        "https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.3.15/angular.js",
        "https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.3.15/angular-route.js",
        "js/howler.min.js",
        "js/badland.js",
);
app->asset->process('style.css' => "css/badland.css");

get '/' => sub {
    my $c = shift;
    $c->cookie('XSRF-TOKEN' => $c->csrf_token, { path => '/' });
    my $colors = $c->app->config->{tile_colors} // [
        '#1a237e', '#4a148c', '#880e4f', '#bf360c', '#1b5e20', '#006064',
    ];
    $c->stash(tile_colors => $colors);
    $c->render('index');
};

get '/badland' => sub {
    my $c = shift;
    my $dbh = $c->dbh;
    my $phrases = $c->app->config->{dancer_phrases};
    $phrases = ['fresh'] unless ref $phrases eq 'ARRAY' and @$phrases;
    my $songs   = $dbh->selectall_arrayref("select * from song order by score desc") or die $dbh->errstr;
    my $asciis  = $dbh->selectall_arrayref("select * from ascii");
    my $count   = scalar @$asciis;
    my $badlands = [];
    for my $song (@$songs) {
        my $ogg = $song->[1];
        $ogg =~ s/\.mp3$/\.ogg/;
        push @$badlands, {
            id    => $song->[0],
            file  => $song->[1],
            ogg   => $ogg,
            song  => $song->[2],
            score => $song->[3],
            ascii => $asciis->[int(rand($count))]->[1],
            asciis => [ map { $asciis->[ int(rand($count)) ]->[1] } 1..4 ],
        }
    }
    $c->render(json => {
        badlands => $badlands,
        dancer_phrases => $phrases,
    }, status => 200);
};

post '/update/:song_id' => sub {
    my $c       = shift;
    my $dbh     = $c->dbh;
    my $song_id = $c->stash('song_id');
    my $csrf    = $c->req->headers->header('X-XSRF-TOKEN') || '';

    if ($csrf ne $c->csrf_token) {
        $c->app->log->warn($c->tx->remote_address . " failed to update " . $song_id . " : BAD TOKEN");
        return $c->rendered(403);
    }

    my $sth = $dbh->prepare("update song set score = score + 1 where id = ?");
    $sth->execute($song_id);
    $sth = $dbh->prepare("select score from song where id = ?");
    $sth->execute($song_id);
    my $score = $sth->fetchrow;

    $c->app->log->info($c->tx->remote_address . " updated " . $song_id);
    $c->render(json => { score => $score }, status => 200);
};

app->start unless caller;


__DATA__
@@ layouts/default.html.ep
<!doctype html>
<html>
    <head>
        <title><%= title %></title>
        <%= asset 'style.css' %>
        % my $colors = stash('tile_colors') // [];
        % my $eye_iris = $colors->[0] // '#2a7fff';
        % my $eye_ring = $colors->[1] // '#0a285a';
        % my $eye_pupil = $colors->[2] // '#000000';
        % my $n = scalar @$colors;
        <style>
            :root {
                --dancer-eye-iris: <%= $eye_iris %>;
                --dancer-eye-ring: <%= $eye_ring %>;
                --dancer-eye-pupil: <%= $eye_pupil %>;
            }
        % if ($n) {
        % for my $i (0 .. $#$colors) {
            .ascii:nth-child(<%= $n %>n+<%= $i + 1 %>) { background-color: <%= $colors->[$i] %>; }
        % }
        % }
        </style>
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

